import { AppShell } from '@/components/app-shell';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import {
    studentAttendanceLogs,
    studentAttendanceScan,
    studentDashboard,
} from '@/routes';
import type { SharedData } from '@/types';
import { Head, Link, usePage } from '@inertiajs/react';
import { BrowserQRCodeReader } from '@zxing/browser';
import {
    Activity,
    AlertCircle,
    ArrowLeft,
    BarChart3,
    Camera,
    CheckCircle2,
    ChevronLeft,
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
    Search,
    ShieldAlert,
    ShieldCheck,
    Sparkles,
    Users,
    Wifi,
    Zap,
} from 'lucide-react';
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

type SecurityAlert = {
    id: number;
    module: string;
    action: string;
    details: string;
    timestamp: string;
    recent_count: number | null;
    window_minutes: number | null;
};

type AttendanceLogRow = {
    id: string;
    student_id?: string;
    name: string;
    program: string;
    checked_in_at?: string;
    time: string;
    status: 'valid' | 'invalid' | 'late' | 'present' | string;
    check_in_distance_m?: number | null;
    check_out_distance_m?: number | null;
};

type ByCourseRow = {
    program: string;
    expected: number;
    scanned: number;
    percentage: number;
};

type ScanState =
    | { status: 'idle' }
    | { status: 'starting' }
    | { status: 'running' }
    | { status: 'error'; message: string }
    | { status: 'unsupported'; message: string };

type Props = {
    event: {
        id: number | string;
        name: string;
        date: string;
        timeIn?: string | null;
        timeEnd?: string | null;
        location?: string | null;
        scannerPortalActive?: boolean;
        geofence_enabled?: boolean;
        geofence_latitude?: number | null;
        geofence_longitude?: number | null;
        geofence_radius_m?: number | null;
    };
    initialLogRows?: AttendanceLogRow[];
    securityAlerts?: SecurityAlert[];
    studentsByProgram?: Record<string, number>;
    scannerBlockedUntil?: string | null;
};

const getGeo = async (): Promise<{
    latitude: number;
    longitude: number;
    accuracy_m: number;
} | null> => {
    if (typeof navigator === 'undefined' || !('geolocation' in navigator))
        return null;

    return new Promise((resolve) => {
        navigator.geolocation.getCurrentPosition(
            (pos) => {
                resolve({
                    latitude: pos.coords.latitude,
                    longitude: pos.coords.longitude,
                    accuracy_m: pos.coords.accuracy,
                });
            },
            () => resolve(null),
            {
                enableHighAccuracy: true,
                timeout: 8000,
                maximumAge: 0,
            },
        );
    });
};

const formatTime12h = (raw?: string | null) => {
    const value = String(raw ?? '').trim();
    if (!value) return '—';

    const match = value.match(/^(\d{1,2}):(\d{2})(?::\d{2})?$/);
    if (!match) return value;

    const hh = Number.parseInt(match[1], 10);
    const mm = match[2];
    if (!Number.isFinite(hh) || hh < 0 || hh > 23) return value;

    const suffix = hh >= 12 ? 'PM' : 'AM';
    const hour12 = ((hh + 11) % 12) + 1;
    return `${hour12}:${mm} ${suffix}`;
};

export default function StudentAttendanceScannerPortalPage({
    event,
    initialLogRows = [],
    securityAlerts: initialSecurityAlerts = [],
    studentsByProgram = {},
    scannerBlockedUntil,
}: Props) {
    const page = usePage<SharedData>();
    const eventId = String(event.id);

    // Active View Tab: 'dashboard' vs 'scanner'
    const [activeTab, setActiveTab] = useState<'dashboard' | 'scanner'>('dashboard');
    const [attendanceMode, setAttendanceMode] = useState<'entry' | 'exit'>('entry');
    const [monitoringEnabled, setMonitoringEnabled] = useState(true);

    // Live Feed State
    const [liveRows, setLiveRows] = useState<AttendanceLogRow[]>(initialLogRows);
    const [byCourse, setByCourse] = useState<ByCourseRow[]>([]);
    const [liveCounts, setLiveCounts] = useState({
        total: initialLogRows.length,
        present: initialLogRows.filter((r) => r.status === 'valid' || r.status === 'present').length,
        late: initialLogRows.filter((r) => r.status === 'late').length,
    });
    const [lastUpdatedAt, setLastUpdatedAt] = useState<string>('');
    const [searchQuery, setSearchQuery] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 6;

    // Scanner & Camera References
    const videoRef = useRef<HTMLVideoElement | null>(null);
    const streamRef = useRef<MediaStream | null>(null);
    const intervalRef = useRef<number | null>(null);
    const zxingRef = useRef<{
        reader: BrowserQRCodeReader;
        stop: () => void;
    } | null>(null);
    const lastValueRef = useRef<{ value: string; at: number } | null>(null);

    const [scanState, setScanState] = useState<ScanState>({ status: 'idle' });
    const [lastScanned, setLastScanned] = useState<{
        status: 'valid' | 'late' | 'invalid';
        message: string;
        studentName?: string;
    } | null>(null);
    const [manualIdInput, setManualIdInput] = useState('');
    const [isSubmittingManual, setIsSubmittingManual] = useState(false);

    // Security & Block status
    const [securityAlerts, setSecurityAlerts] = useState<SecurityAlert[]>(initialSecurityAlerts);
    const [scannerRemaining, setScannerRemaining] = useState<number | null>(null);

    const isScannerBlocked = (scannerRemaining ?? 0) > 0;

    const barcodeDetectorSupported = useMemo(() => {
        return typeof window !== 'undefined' && 'BarcodeDetector' in window;
    }, []);

    // Check if scan is blocked past 30m after registration end time
    const scanBlocked = useMemo(() => {
        const date = String(event.date ?? '').trim();
        const timeEnd = String(event.timeEnd ?? '').trim();
        if (!date || !timeEnd) return false;

        const match = timeEnd.match(/^(\d{1,2}):(\d{2})(?::\d{2})?$/);
        if (!match) return false;

        const hours = Number.parseInt(match[1], 10);
        const minutes = Number.parseInt(match[2], 10);
        if (!Number.isFinite(hours) || !Number.isFinite(minutes)) return false;

        const cutoff = new Date(`${date}T00:00:00`);
        if (Number.isNaN(cutoff.getTime())) return false;

        cutoff.setHours(hours, minutes, 0, 0);
        const blockAt = new Date(cutoff.getTime() + 30 * 60 * 1000);
        return new Date() >= blockAt;
    }, [event.date, event.timeEnd]);

    // Check scanner block status
    useEffect(() => {
        const interval = setInterval(async () => {
            try {
                const res = await fetch('/api/auth/status/scanner-block', {
                    headers: { 'X-Requested-With': 'XMLHttpRequest' },
                });
                if (res.ok) {
                    const data = await res.json();
                    setScannerRemaining(
                        data.scanner_blocked && data.remaining_seconds > 0
                            ? data.remaining_seconds
                            : null,
                    );
                }
            } catch {
                // silent
            }
        }, 3000);

        return () => clearInterval(interval);
    }, []);

    // Flash notifications
    useEffect(() => {
        const flashError = (page.props as any)?.flash?.error;
        if (typeof flashError === 'string' && flashError.trim() !== '') {
            Swal.fire({
                icon: 'info',
                title: 'Scanner Portal Notification',
                text: flashError,
                confirmButtonColor: '#0b2d66',
            });
        }
    }, [page.props]);

    // Refresh live logs from the backend
    const refreshLogs = useCallback(async () => {
        if (!eventId) return;
        try {
            const res = await fetch(studentAttendanceLogs(eventId), {
                headers: {
                    Accept: 'application/json',
                    'X-Requested-With': 'XMLHttpRequest',
                },
            });
            if (!res.ok) return;

            const data = await res.json();
            const rows: AttendanceLogRow[] = (data.rows ?? []).map((r: any, idx: number) => ({
                id: String(r.id ?? idx),
                student_id: String(r.student_id ?? ''),
                name: String(r.name ?? ''),
                program: String(r.program ?? ''),
                checked_in_at: String(r.checked_in_at ?? ''),
                time: String(r.time ?? ''),
                status: String(r.status ?? '').toLowerCase(),
                check_in_distance_m: r.check_in_distance_m,
                check_out_distance_m: r.check_out_distance_m,
            }));

            setLiveRows(rows);
            setLiveCounts({
                total: Number(data.counts?.total ?? rows.length),
                present: Number(data.counts?.present ?? 0),
                late: Number(data.counts?.late ?? 0),
            });
            if (Array.isArray(data.byCourse)) {
                setByCourse(data.byCourse);
            }
            setLastUpdatedAt(data.server_time ?? new Date().toLocaleTimeString());
        } catch (err) {
            console.error('Error refreshing student attendance logs:', err);
        }
    }, [eventId]);

    // Live logs polling interval
    useEffect(() => {
        let interval: NodeJS.Timeout | null = null;
        if (monitoringEnabled && eventId) {
            void refreshLogs();
            interval = setInterval(() => {
                void refreshLogs();
            }, 2500);
        }
        return () => {
            if (interval) clearInterval(interval);
        };
    }, [monitoringEnabled, eventId, refreshLogs]);

    // Camera Stop helper
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

    // Attendance Scan Processor
    const handleScanSubmission = async (rawValue: string) => {
        const value = String(rawValue ?? '').trim();
        if (!value) return;

        const now = Date.now();
        if (
            lastValueRef.current?.value === value &&
            now - lastValueRef.current.at < 1500
        )
            return;
        lastValueRef.current = { value, at: now };

        try {
            const getCsrfToken = () => {
                const match = document.cookie.match(/XSRF-TOKEN=([^;]+)/);
                if (match) return decodeURIComponent(match[1]);
                return (
                    (document.querySelector('meta[name="csrf-token"]') as HTMLMetaElement | null)
                        ?.content || ''
                );
            };
            const token = getCsrfToken();

            const geo = await getGeo();
            if (event.geofence_enabled && !geo) {
                playScanErrorSound();
                setLastScanned({
                    status: 'invalid',
                    message: 'Location required (Please turn on GPS and allow location access).',
                });
                Swal.fire({
                    icon: 'warning',
                    title: 'GPS Location Required',
                    text: 'This event requires verified GPS geofencing. Please turn on your location.',
                    confirmButtonColor: '#0b2d66',
                });
                return;
            }

            const res = await fetch(studentAttendanceScan(event.id), {
                method: 'POST',
                credentials: 'include',
                headers: {
                    Accept: 'application/json',
                    'Content-Type': 'application/json',
                    'X-Requested-With': 'XMLHttpRequest',
                    ...(token ? { 'X-CSRF-TOKEN': token, 'X-XSRF-TOKEN': token } : {}),
                },
                body: JSON.stringify({
                    value,
                    mode: attendanceMode,
                    scan_type: attendanceMode,
                    ...(geo || {}),
                }),
            });

            const payload = await res.json().catch(() => ({}) as any);

            if (!res.ok) {
                playScanErrorSound();
                const errMsg = String(payload?.message ?? 'Attendance scan rejected.');
                setLastScanned({
                    status: 'invalid',
                    message: errMsg,
                });

                Swal.fire({
                    icon: 'error',
                    title: 'Attendance Rejected',
                    text: errMsg,
                    confirmButtonColor: '#0b2d66',
                });
                return;
            }

            const isLate = payload?.status === 'late' || (payload?.message && payload.message.toLowerCase().includes('late'));
            if (isLate) {
                playScanLateSound();
            } else {
                playScanSuccessSound();
            }

            const studentName = String(payload?.student?.name ?? value);
            const statusType = isLate ? 'late' : 'valid';

            setLastScanned({
                status: statusType,
                message: payload?.message || `Attendance recorded (${isLate ? 'Late' : 'On-Time'})`,
                studentName,
            });

            void refreshLogs();
            setTimeout(() => setLastScanned(null), 4000);
        } catch (err: any) {
            playScanErrorSound();
            setLastScanned({
                status: 'invalid',
                message: err?.message || 'Network connection failed.',
            });
            Swal.fire({
                icon: 'error',
                title: 'Network Error',
                text: 'Could not connect to the DSAMS attendance server.',
                confirmButtonColor: '#0b2d66',
            });
        }
    };

    // Camera Start helper
    const startScanner = async () => {
        if (event.scannerPortalActive === false) {
            setScanState({
                status: 'error',
                message: 'Scanner portal is currently deactivated by the administrator.',
            });
            return;
        }

        if (scanBlocked) {
            setScanState({
                status: 'error',
                message: 'Scanning is disabled 30 minutes after registration end time.',
            });
            return;
        }

        if (
            typeof window !== 'undefined' &&
            !window.isSecureContext &&
            window.location.hostname !== 'localhost' &&
            window.location.hostname !== '127.0.0.1'
        ) {
            const msg = 'Camera access requires a Secure Context (HTTPS or localhost).';
            setScanState({ status: 'error', message: msg });
            Swal.fire({
                icon: 'warning',
                title: 'HTTPS Required',
                text: msg,
                confirmButtonColor: '#0b2d66',
            });
            return;
        }

        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
            const msg = 'Camera API is not supported or blocked by your browser settings.';
            setScanState({ status: 'error', message: msg });
            return;
        }

        setScanState({ status: 'starting' });

        try {
            stopScanner();

            const video = videoRef.current;
            if (!video) {
                setScanState({
                    status: 'error',
                    message: 'Video viewport not available.',
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
                const Detector = (window as any).BarcodeDetector as new (options: {
                    formats: string[];
                }) => {
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
                        if (value) void handleScanSubmission(value);
                    } catch {
                        // ignore frame parse errors
                    }
                }, 250);
            } else {
                const reader = new BrowserQRCodeReader();
                const controls = await reader.decodeFromVideoDevice(
                    undefined,
                    video,
                    (result) => {
                        const value = result?.getText?.() ?? '';
                        if (value) void handleScanSubmission(value);
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
            console.error('[StudentScannerPortal] Camera error:', err);
            stopScanner();
            setScanState({
                status: 'error',
                message: err?.message ?? 'Unable to activate camera.',
            });
        }
    };

    // Auto-start camera when switching to scanner tab
    useEffect(() => {
        if (activeTab === 'scanner') {
            const timeout = setTimeout(() => {
                void startScanner();
            }, 150);
            return () => {
                clearTimeout(timeout);
                stopScanner();
            };
        } else {
            stopScanner();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [activeTab]);

    // Handle Manual ID Input
    const handleManualSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!manualIdInput.trim() || isSubmittingManual) return;
        setIsSubmittingManual(true);
        try {
            await handleScanSubmission(manualIdInput.trim());
            setManualIdInput('');
        } finally {
            setIsSubmittingManual(false);
        }
    };

    // Filtered rows for live table
    const filteredRows = useMemo(() => {
        const query = searchQuery.toLowerCase().trim();
        if (!query) return liveRows;
        return liveRows.filter(
            (r) =>
                r.name.toLowerCase().includes(query) ||
                (r.student_id && r.student_id.toLowerCase().includes(query)) ||
                r.program.toLowerCase().includes(query) ||
                r.status.toLowerCase().includes(query),
        );
    }, [liveRows, searchQuery]);

    const totalPages = Math.ceil(filteredRows.length / itemsPerPage) || 1;
    const paginatedRows = useMemo(() => {
        const start = (currentPage - 1) * itemsPerPage;
        return filteredRows.slice(start, start + itemsPerPage);
    }, [filteredRows, currentPage, itemsPerPage]);

    return (
        <AppShell>
            <Head title={`Attendance Scanner - ${event.name}`} />

            <div className="relative min-h-screen overflow-x-hidden bg-slate-50/50 pb-16 transition-colors duration-500 dark:bg-[#020617]">
                {/* Background Ambient Glow Orbs */}
                <div className="pointer-events-none fixed inset-0 overflow-hidden">
                    <div className="absolute -top-32 -left-32 h-96 w-96 rounded-full bg-blue-600/10 blur-[120px] dark:bg-blue-600/5" />
                    <div className="absolute -right-32 -bottom-32 h-96 w-96 rounded-full bg-indigo-600/10 blur-[120px] dark:bg-indigo-600/5" />
                    <div className="absolute top-1/3 right-1/4 h-80 w-80 rounded-full bg-emerald-600/5 blur-[100px]" />
                </div>

                <div className="relative z-10 mx-auto flex w-full max-w-7xl flex-col gap-6 px-4 pt-6 sm:px-6 lg:px-8">
                    {/* TOP DSAMS NAVY GRADIENT HERO HEADER */}
                    <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#0b1c5c] via-[#1e3a8a] to-[#0B4DFF] p-6 text-white shadow-2xl transition-all duration-300 sm:p-8">
                        {/* Mesh background glow elements */}
                        <div className="pointer-events-none absolute -top-24 -right-24 h-96 w-96 rounded-full bg-blue-400/20 blur-3xl" />
                        <div className="pointer-events-none absolute -bottom-24 -left-24 h-96 w-96 rounded-full bg-indigo-500/20 blur-3xl" />
                        <div className="pointer-events-none absolute top-1/2 right-1/3 h-64 w-64 -translate-y-1/2 rounded-full bg-cyan-400/10 blur-2xl" />

                        <div className="relative z-10 flex flex-col justify-between gap-6 lg:flex-row lg:items-center">
                            {/* Left Info Column */}
                            <div className="space-y-4">
                                <div className="flex flex-wrap items-center gap-3">
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        className="h-8 gap-2 rounded-xl border border-white/20 bg-white/10 px-3 text-xs font-semibold text-white backdrop-blur-md transition-all hover:bg-white/20 hover:text-white"
                                        asChild
                                    >
                                        <Link href={studentDashboard()}>
                                            <ArrowLeft className="h-3.5 w-3.5" />
                                            Back to Dashboard
                                        </Link>
                                    </Button>

                                    <div className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3.5 py-1 text-xs font-bold text-white shadow-inner backdrop-blur-md">
                                        <span className="relative flex h-2 w-2">
                                            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75"></span>
                                            <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-400"></span>
                                        </span>
                                        <span>STUDENT PORTAL ACCESS</span>
                                    </div>

                                    {event.scannerPortalActive === false ? (
                                        <Badge variant="outline" className="border-rose-400/30 bg-rose-500/20 text-rose-200">
                                            PORTAL CLOSED
                                        </Badge>
                                    ) : (
                                        <Badge variant="outline" className="border-emerald-400/30 bg-emerald-500/20 text-emerald-200">
                                            SESSION ACTIVE
                                        </Badge>
                                    )}

                                    {isScannerBlocked && (
                                        <Badge variant="destructive" className="animate-pulse bg-rose-600 text-white">
                                            BLOCKED ({scannerRemaining}s)
                                        </Badge>
                                    )}
                                </div>

                                <div>
                                    <div className="flex items-center gap-2">
                                        <h1 className="text-2xl font-black tracking-tight text-white sm:text-3xl">
                                            {event.name}
                                        </h1>
                                    </div>
                                    <p className="mt-1 text-xs font-medium text-blue-100/90 sm:text-sm">
                                        Student Real-Time Attendance Monitoring & Scanning Station
                                    </p>
                                </div>

                                {/* Event detail chips */}
                                <div className="flex flex-wrap items-center gap-2 text-xs">
                                    <span className="inline-flex items-center gap-1.5 rounded-lg border border-white/15 bg-white/10 px-2.5 py-1 font-medium text-white backdrop-blur-sm">
                                        <Clock className="h-3.5 w-3.5 text-blue-200" />
                                        Date: {event.date || 'Today'}
                                    </span>
                                    {event.timeIn && (
                                        <span className="inline-flex items-center gap-1.5 rounded-lg border border-white/15 bg-white/10 px-2.5 py-1 font-medium text-white backdrop-blur-sm">
                                            <LogIn className="h-3.5 w-3.5 text-emerald-300" />
                                            Start: {formatTime12h(event.timeIn)}
                                        </span>
                                    )}
                                    {event.timeEnd && (
                                        <span className="inline-flex items-center gap-1.5 rounded-lg border border-white/15 bg-white/10 px-2.5 py-1 font-medium text-white backdrop-blur-sm">
                                            <LogOut className="h-3.5 w-3.5 text-rose-300" />
                                            End: {formatTime12h(event.timeEnd)}
                                        </span>
                                    )}
                                    {event.location && (
                                        <span className="inline-flex items-center gap-1.5 rounded-lg border border-white/15 bg-white/10 px-2.5 py-1 font-medium text-white backdrop-blur-sm">
                                            <MapPin className="h-3.5 w-3.5 text-cyan-300" />
                                            {event.location}
                                        </span>
                                    )}
                                    {event.geofence_enabled && (
                                        <span className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-400/30 bg-emerald-500/20 px-2.5 py-1 font-semibold text-emerald-200 backdrop-blur-sm">
                                            <Compass className="h-3.5 w-3.5 text-emerald-300" />
                                            Geofenced ({event.geofence_radius_m ?? 50}m)
                                        </span>
                                    )}
                                </div>
                            </div>

                            {/* Right Actions & Controls Column */}
                            <div className="flex flex-col items-start gap-3 sm:flex-row sm:items-center lg:flex-col lg:items-end">
                                {/* Entry vs Exit Selector */}
                                <div className="inline-flex gap-1 rounded-2xl border border-white/20 bg-black/25 p-1 backdrop-blur-md">
                                    <button
                                        type="button"
                                        onClick={() => setAttendanceMode('entry')}
                                        className={cn(
                                            'flex h-8 items-center gap-1.5 rounded-xl px-3.5 text-xs font-extrabold tracking-wide uppercase transition-all duration-200',
                                            attendanceMode === 'entry'
                                                ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/40'
                                                : 'text-white/80 hover:bg-white/10 hover:text-white',
                                        )}
                                    >
                                        <LogIn className="h-3.5 w-3.5" />
                                        Time-In
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setAttendanceMode('exit')}
                                        className={cn(
                                            'flex h-8 items-center gap-1.5 rounded-xl px-3.5 text-xs font-extrabold tracking-wide uppercase transition-all duration-200',
                                            attendanceMode === 'exit'
                                                ? 'bg-rose-500 text-white shadow-lg shadow-rose-500/40'
                                                : 'text-white/80 hover:bg-white/10 hover:text-white',
                                        )}
                                    >
                                        <LogOut className="h-3.5 w-3.5" />
                                        Time-Out
                                    </button>
                                </div>

                                <div className="flex items-center gap-2">
                                    <Button
                                        type="button"
                                        size="sm"
                                        className={cn(
                                            'h-9 gap-2 rounded-xl px-4 text-xs font-bold transition-all duration-200 active:scale-95',
                                            monitoringEnabled
                                                ? 'border border-white/25 bg-white/15 text-white hover:bg-white/25 backdrop-blur-md'
                                                : 'bg-white text-[#1e3a8a] shadow-md hover:bg-blue-50',
                                        )}
                                        onClick={() => setMonitoringEnabled((prev) => !prev)}
                                    >
                                        {monitoringEnabled ? (
                                            <>
                                                <Pause className="h-3.5 w-3.5 fill-current" />
                                                <span>Live Sync On</span>
                                            </>
                                        ) : (
                                            <>
                                                <Play className="h-3.5 w-3.5 fill-current" />
                                                <span>Resume Sync</span>
                                            </>
                                        )}
                                    </Button>

                                    <Button
                                        type="button"
                                        variant="ghost"
                                        size="icon"
                                        className="h-9 w-9 rounded-xl border border-white/20 bg-white/10 text-white transition-all hover:bg-white/20 active:scale-95"
                                        onClick={() => void refreshLogs()}
                                        title="Manually refresh attendance logs"
                                    >
                                        <RefreshCw
                                            className={`h-4 w-4 ${monitoringEnabled ? 'animate-[spin_3s_linear_infinite]' : ''}`}
                                        />
                                    </Button>
                                </div>
                            </div>
                        </div>

                        {/* Security Alert Banner in Header if any */}
                        {securityAlerts.length > 0 && (
                            <div className="mt-4 flex items-start gap-3 rounded-2xl border border-rose-300/30 bg-rose-950/40 p-3.5 text-xs text-rose-100 backdrop-blur-md">
                                <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0 text-rose-300" />
                                <div>
                                    <span className="font-bold text-rose-200">Security Guard Active: </span>
                                    {securityAlerts[0].recent_count
                                        ? `${securityAlerts[0].recent_count} unverified access attempts recorded within ${securityAlerts[0].window_minutes ?? 15} minutes.`
                                        : securityAlerts[0].details}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* SEGMENTED TAB SWITCHER */}
                    <div className="flex flex-wrap items-center justify-between gap-3">
                        <div className="inline-flex rounded-2xl border border-slate-200/80 bg-white/90 p-1.5 shadow-sm backdrop-blur-md dark:border-slate-800 dark:bg-slate-900/90">
                            <button
                                type="button"
                                onClick={() => setActiveTab('dashboard')}
                                className={cn(
                                    'flex items-center gap-2 rounded-xl px-5 py-2 text-xs font-extrabold tracking-wide uppercase transition-all duration-200',
                                    activeTab === 'dashboard'
                                        ? 'bg-[#0b2d66] text-white shadow-md shadow-blue-900/30 dark:bg-blue-600'
                                        : 'text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800',
                                )}
                            >
                                <BarChart3 className="h-4 w-4" />
                                Dashboard Overview
                            </button>
                            <button
                                type="button"
                                onClick={() => setActiveTab('scanner')}
                                className={cn(
                                    'flex items-center gap-2 rounded-xl px-5 py-2 text-xs font-extrabold tracking-wide uppercase transition-all duration-200',
                                    activeTab === 'scanner'
                                        ? 'bg-[#0b2d66] text-white shadow-md shadow-blue-900/30 dark:bg-blue-600'
                                        : 'text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800',
                                )}
                            >
                                <Camera className="h-4 w-4" />
                                Scanner Station
                            </button>
                        </div>

                        {lastUpdatedAt && (
                            <div className="flex items-center gap-2 text-xs font-medium text-slate-500 dark:text-slate-400">
                                <Activity className="h-3.5 w-3.5 text-blue-500" />
                                <span>Last synchronized at: {lastUpdatedAt}</span>
                            </div>
                        )}
                    </div>

                    {/* TAB CONTENT: DASHBOARD OVERVIEW */}
                    {activeTab === 'dashboard' && (
                        <div className="space-y-6">
                            {/* KPI STAT CARDS */}
                            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                                {/* Stat 1: Total Checked In */}
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
                                                {liveCounts.total}
                                            </p>
                                            <p className="text-[11px] font-semibold text-blue-600 dark:text-blue-400">
                                                Active Attendees
                                            </p>
                                        </div>
                                    </div>
                                    <div className="mt-4 h-1.5 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                                        <div
                                            className="h-full rounded-full bg-gradient-to-r from-blue-500 to-indigo-600"
                                            style={{ width: '100%' }}
                                        />
                                    </div>
                                </Card>

                                {/* Stat 2: On Time */}
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
                                                {liveCounts.present}
                                            </p>
                                            <p className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
                                                Prompt Scans
                                            </p>
                                        </div>
                                    </div>
                                    <div className="mt-4 h-1.5 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                                        <div
                                            className="h-full rounded-full bg-gradient-to-r from-emerald-400 to-emerald-600"
                                            style={{
                                                width: `${liveCounts.total > 0 ? (liveCounts.present / liveCounts.total) * 100 : 100}%`,
                                            }}
                                        />
                                    </div>
                                </Card>

                                {/* Stat 3: Late Arrivals */}
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
                                                {liveCounts.late}
                                            </p>
                                            <p className="text-[11px] font-semibold text-rose-600 dark:text-rose-400">
                                                Tardy Scans
                                            </p>
                                        </div>
                                    </div>
                                    <div className="mt-4 h-1.5 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                                        <div
                                            className="h-full rounded-full bg-gradient-to-r from-rose-400 to-rose-600"
                                            style={{
                                                width: `${liveCounts.total > 0 ? (liveCounts.late / liveCounts.total) * 100 : 0}%`,
                                            }}
                                        />
                                    </div>
                                </Card>
                            </div>

                            {/* MAIN GRID: LIVE FEED TABLE & SIDE DETAILS */}
                            <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
                                {/* Left Column: Live Activity Feed (8/12) */}
                                <div className="flex flex-col gap-6 lg:col-span-8">
                                    <Card className="overflow-hidden rounded-3xl border border-slate-100 bg-white shadow-xl shadow-slate-200/50 dark:border-slate-800 dark:bg-[#0B192C]/50 dark:shadow-none">
                                        <CardHeader className="border-b border-slate-100 bg-slate-50/50 px-6 py-4 dark:border-slate-800 dark:bg-[#0B192C]/70">
                                            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                                                <div className="flex items-center gap-3">
                                                    <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-blue-50 text-blue-600 dark:bg-blue-950/40 dark:text-blue-400">
                                                        <Activity className="h-4 w-4" />
                                                    </div>
                                                    <div>
                                                        <CardTitle className="text-base font-bold text-slate-900 dark:text-white">
                                                            Live Activity Feed
                                                        </CardTitle>
                                                        <p className="text-xs text-slate-500 dark:text-slate-400">
                                                            Streaming verified student attendance logs
                                                        </p>
                                                    </div>
                                                </div>

                                                <div className="flex items-center gap-2">
                                                    <div className="relative w-full sm:w-56">
                                                        <Search className="absolute top-1/2 left-3 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
                                                        <Input
                                                            type="text"
                                                            placeholder="Filter students..."
                                                            value={searchQuery}
                                                            onChange={(e) => {
                                                                setSearchQuery(e.target.value);
                                                                setCurrentPage(1);
                                                            }}
                                                            className="h-8 rounded-xl border-slate-200 bg-white pl-8 text-xs dark:border-slate-700 dark:bg-slate-900"
                                                        />
                                                    </div>
                                                    <div className="flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-[10px] font-bold text-emerald-700 uppercase dark:border-emerald-800/40 dark:bg-emerald-950/30 dark:text-emerald-400">
                                                        <span className="relative flex h-2 w-2">
                                                            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75"></span>
                                                            <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500"></span>
                                                        </span>
                                                        <span>Live</span>
                                                    </div>
                                                </div>
                                            </div>
                                        </CardHeader>

                                        <CardContent className="p-0">
                                            <div className="overflow-x-auto">
                                                <table className="w-full text-left text-xs">
                                                    <thead>
                                                        <tr className="border-b border-slate-100 bg-slate-50/70 text-[10px] font-extrabold tracking-wider text-slate-500 uppercase dark:border-slate-800 dark:bg-slate-900/50 dark:text-slate-400">
                                                            <th className="px-6 py-3.5">Student</th>
                                                            <th className="px-4 py-3.5">Program</th>
                                                            <th className="px-4 py-3.5">Timestamp</th>
                                                            <th className="px-6 py-3.5 text-right">Status</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                                        {paginatedRows.length === 0 ? (
                                                            <tr>
                                                                <td colSpan={4} className="px-6 py-12 text-center text-slate-400 dark:text-slate-500">
                                                                    <div className="flex flex-col items-center justify-center gap-2">
                                                                        <Users className="h-8 w-8 stroke-1 text-slate-300 dark:text-slate-600" />
                                                                        <p className="text-sm font-semibold">No attendance records yet</p>
                                                                        <p className="text-xs text-slate-400">
                                                                            {searchQuery
                                                                                ? 'No results matched your search filter.'
                                                                                : 'Scanned student records will stream here in real time.'}
                                                                        </p>
                                                                    </div>
                                                                </td>
                                                            </tr>
                                                        ) : (
                                                            paginatedRows.map((row, idx) => {
                                                                const isLate = row.status === 'late';
                                                                const isInvalid = row.status === 'invalid';
                                                                const initials = row.name
                                                                    ? row.name
                                                                          .split(' ')
                                                                          .map((n) => n[0])
                                                                          .join('')
                                                                          .substring(0, 2)
                                                                          .toUpperCase()
                                                                    : 'ST';

                                                                return (
                                                                    <tr
                                                                        key={row.id || idx}
                                                                        className="group transition-colors hover:bg-slate-50/80 dark:hover:bg-slate-800/40"
                                                                    >
                                                                        <td className="px-6 py-3.5">
                                                                            <div className="flex items-center gap-3">
                                                                                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 text-[10px] font-bold text-white shadow-sm">
                                                                                    {initials}
                                                                                </div>
                                                                                <div className="min-w-0">
                                                                                    <p className="truncate font-bold text-slate-900 dark:text-white">
                                                                                        {row.name}
                                                                                    </p>
                                                                                    <p className="truncate text-[11px] font-medium text-slate-400">
                                                                                        {row.student_id || row.id}
                                                                                    </p>
                                                                                </div>
                                                                            </div>
                                                                        </td>
                                                                        <td className="px-4 py-3.5">
                                                                            <span className="inline-flex rounded-lg border border-slate-200 bg-slate-100 px-2.5 py-1 text-[11px] font-semibold text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300">
                                                                                {row.program || '—'}
                                                                            </span>
                                                                        </td>
                                                                        <td className="px-4 py-3.5 text-slate-600 dark:text-slate-400">
                                                                            <div className="flex items-center gap-1.5 font-medium">
                                                                                <Clock className="h-3 w-3 text-slate-400" />
                                                                                {row.time || formatTime12h(row.checked_in_at)}
                                                                            </div>
                                                                        </td>
                                                                        <td className="px-6 py-3.5 text-right">
                                                                            {isInvalid ? (
                                                                                <span className="inline-flex items-center gap-1 rounded-full border border-rose-200 bg-rose-50 px-2.5 py-0.5 text-[10px] font-bold text-rose-700 uppercase dark:border-rose-900/40 dark:bg-rose-950/30 dark:text-rose-400">
                                                                                    <AlertCircle className="h-3 w-3" />
                                                                                    Invalid
                                                                                </span>
                                                                            ) : isLate ? (
                                                                                <span className="inline-flex items-center gap-1 rounded-full border border-amber-200 bg-amber-50 px-2.5 py-0.5 text-[10px] font-bold text-amber-700 uppercase dark:border-amber-900/40 dark:bg-amber-950/30 dark:text-amber-400">
                                                                                    <Clock className="h-3 w-3" />
                                                                                    Late
                                                                                </span>
                                                                            ) : (
                                                                                <span className="inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-0.5 text-[10px] font-bold text-emerald-700 uppercase dark:border-emerald-900/40 dark:bg-emerald-950/30 dark:text-emerald-400">
                                                                                    <CheckCircle2 className="h-3 w-3" />
                                                                                    Present
                                                                                </span>
                                                                            )}
                                                                        </td>
                                                                    </tr>
                                                                );
                                                            })
                                                        )}
                                                    </tbody>
                                                </table>
                                            </div>

                                            {/* Pagination Footer */}
                                            {filteredRows.length > itemsPerPage && (
                                                <div className="flex items-center justify-between border-t border-slate-100 bg-slate-50/50 px-6 py-3 text-xs text-slate-500 dark:border-slate-800 dark:bg-slate-900/50 dark:text-slate-400">
                                                    <div>
                                                        Showing {(currentPage - 1) * itemsPerPage + 1} to{' '}
                                                        {Math.min(currentPage * itemsPerPage, filteredRows.length)} of{' '}
                                                        {filteredRows.length} attendees
                                                    </div>
                                                    <div className="flex items-center gap-1">
                                                        <Button
                                                            variant="outline"
                                                            size="icon"
                                                            className="h-7 w-7 rounded-lg"
                                                            disabled={currentPage === 1}
                                                            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                                                        >
                                                            <ChevronLeft className="h-3.5 w-3.5" />
                                                        </Button>
                                                        <span className="px-2 font-bold text-slate-700 dark:text-slate-300">
                                                            {currentPage} / {totalPages}
                                                        </span>
                                                        <Button
                                                            variant="outline"
                                                            size="icon"
                                                            className="h-7 w-7 rounded-lg"
                                                            disabled={currentPage >= totalPages}
                                                            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                                                        >
                                                            <ChevronRight className="h-3.5 w-3.5" />
                                                        </Button>
                                                    </div>
                                                </div>
                                            )}
                                        </CardContent>
                                    </Card>
                                </div>

                                {/* Right Column: Details & Program Breakdown (4/12) */}
                                <div className="flex flex-col gap-6 lg:col-span-4">
                                    {/* Event Details Card */}
                                    <Card className="rounded-3xl border border-slate-100 bg-white p-5 shadow-lg shadow-slate-200/50 dark:border-slate-800 dark:bg-[#0B192C]/50 dark:shadow-none">
                                        <CardHeader className="p-0 pb-4">
                                            <div className="flex items-center gap-2.5">
                                                <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 dark:bg-indigo-950/40 dark:text-indigo-400">
                                                    <Info className="h-4 w-4" />
                                                </div>
                                                <CardTitle className="text-sm font-bold text-slate-900 dark:text-white">
                                                    Event Information
                                                </CardTitle>
                                            </div>
                                        </CardHeader>
                                        <CardContent className="space-y-3.5 p-0 text-xs">
                                            <div className="flex items-center justify-between border-b border-slate-100 pb-2.5 dark:border-slate-800">
                                                <span className="text-slate-500 dark:text-slate-400">Scheduled Date</span>
                                                <span className="font-bold text-slate-900 dark:text-white">{event.date || '—'}</span>
                                            </div>
                                            <div className="flex items-center justify-between border-b border-slate-100 pb-2.5 dark:border-slate-800">
                                                <span className="text-slate-500 dark:text-slate-400">Venue / Location</span>
                                                <span className="font-bold text-slate-900 dark:text-white">{event.location || 'Campus'}</span>
                                            </div>
                                            <div className="flex items-center justify-between border-b border-slate-100 pb-2.5 dark:border-slate-800">
                                                <span className="text-slate-500 dark:text-slate-400">Check-in Window</span>
                                                <span className="font-bold text-emerald-600 dark:text-emerald-400">
                                                    {formatTime12h(event.timeIn)}
                                                </span>
                                            </div>
                                            <div className="flex items-center justify-between border-b border-slate-100 pb-2.5 dark:border-slate-800">
                                                <span className="text-slate-500 dark:text-slate-400">Check-out Window</span>
                                                <span className="font-bold text-rose-600 dark:text-rose-400">
                                                    {formatTime12h(event.timeEnd)}
                                                </span>
                                            </div>
                                            <div className="flex items-center justify-between">
                                                <span className="text-slate-500 dark:text-slate-400">Geofence Guard</span>
                                                <span className="font-bold text-slate-900 dark:text-white">
                                                    {event.geofence_enabled ? `Active (${event.geofence_radius_m ?? 50}m)` : 'Disabled'}
                                                </span>
                                            </div>
                                        </CardContent>
                                    </Card>

                                    {/* Program Attendance Breakdown Card */}
                                    <Card className="rounded-3xl border border-slate-100 bg-white p-5 shadow-lg shadow-slate-200/50 dark:border-slate-800 dark:bg-[#0B192C]/50 dark:shadow-none">
                                        <CardHeader className="p-0 pb-4">
                                            <div className="flex items-center gap-2.5">
                                                <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-blue-50 text-blue-600 dark:bg-blue-950/40 dark:text-blue-400">
                                                    <BarChart3 className="h-4 w-4" />
                                                </div>
                                                <CardTitle className="text-sm font-bold text-slate-900 dark:text-white">
                                                    Course Distribution
                                                </CardTitle>
                                            </div>
                                        </CardHeader>
                                        <CardContent className="space-y-3.5 p-0">
                                            {byCourse.length === 0 ? (
                                                <p className="text-xs text-slate-400">
                                                    Program distribution will compute automatically upon scans.
                                                </p>
                                            ) : (
                                                byCourse.map((item, i) => (
                                                    <div key={i} className="space-y-1.5 text-xs">
                                                        <div className="flex justify-between font-semibold">
                                                            <span className="text-slate-700 dark:text-slate-300">{item.program}</span>
                                                            <span className="text-slate-500 dark:text-slate-400">
                                                                {item.scanned} scanned ({item.percentage}%)
                                                            </span>
                                                        </div>
                                                        <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                                                            <div
                                                                className="h-full rounded-full bg-gradient-to-r from-blue-500 to-indigo-600 transition-all duration-500"
                                                                style={{ width: `${Math.min(100, item.percentage)}%` }}
                                                            />
                                                        </div>
                                                    </div>
                                                ))
                                            )}
                                        </CardContent>
                                    </Card>

                                    {/* Security & Access Protection Card */}
                                    <Card className="rounded-3xl border border-blue-100 bg-gradient-to-br from-blue-50/50 to-indigo-50/30 p-5 shadow-sm dark:border-blue-950/40 dark:bg-[#0B192C]/30">
                                        <div className="flex items-start gap-3">
                                            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl bg-blue-600 text-white shadow-md shadow-blue-500/20">
                                                <ShieldCheck className="h-4 w-4" />
                                            </div>
                                            <div className="space-y-1 text-xs">
                                                <p className="font-bold text-slate-900 dark:text-white">
                                                    Student Authorization Guard
                                                </p>
                                                <p className="leading-relaxed text-slate-600 dark:text-slate-400">
                                                    This scanner is restricted exclusively to authorized students. Scans verify ownership, course eligibility, evaluation clearance, and physical GPS radius.
                                                </p>
                                            </div>
                                        </div>
                                    </Card>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* TAB CONTENT: SCANNER STATION */}
                    {activeTab === 'scanner' && (
                        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
                            {/* Left Viewport & Scanning Canvas (8/12) */}
                            <div className="flex flex-col gap-6 lg:col-span-8">
                                <Card className="overflow-hidden rounded-3xl border border-slate-100 bg-white shadow-2xl shadow-slate-200/50 dark:border-slate-800 dark:bg-[#0B192C]/50 dark:shadow-none">
                                    <CardHeader className="border-b border-slate-100 bg-slate-50/50 px-6 py-4 dark:border-slate-800 dark:bg-[#0B192C]/70">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-3">
                                                <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-blue-50 text-blue-600 dark:bg-blue-950/40 dark:text-blue-400">
                                                    <Camera className="h-4 w-4" />
                                                </div>
                                                <div>
                                                    <CardTitle className="text-base font-bold text-slate-900 dark:text-white">
                                                        Camera Scanner Viewport
                                                    </CardTitle>
                                                    <p className="text-xs text-slate-500 dark:text-slate-400">
                                                        Align the student QR code within the scanning frame
                                                    </p>
                                                </div>
                                            </div>

                                            <div className="flex items-center gap-2">
                                                {scanState.status === 'running' ? (
                                                    <Badge className="bg-emerald-600 text-white">SCANNING ACTIVE</Badge>
                                                ) : scanState.status === 'starting' ? (
                                                    <Badge className="bg-amber-500 text-white">STARTING CAMERA</Badge>
                                                ) : (
                                                    <Badge variant="outline">IDLE</Badge>
                                                )}
                                            </div>
                                        </div>
                                    </CardHeader>

                                    <CardContent className="space-y-4 p-6">
                                        {/* Camera Viewport */}
                                        <div className="relative aspect-[16/9] w-full overflow-hidden rounded-3xl border border-slate-800 bg-slate-950 shadow-2xl">
                                            <video
                                                ref={videoRef}
                                                className="absolute inset-0 h-full w-full object-cover"
                                                playsInline
                                                muted
                                            />

                                            {/* Camera Reticle Overlay */}
                                            <div className="pointer-events-none absolute inset-0">
                                                <div className="absolute inset-0 bg-black/35" />
                                                <div className="absolute top-1/2 left-1/2 h-56 w-56 -translate-x-1/2 -translate-y-1/2 rounded-3xl border-2 border-white/40 shadow-[0_0_0_1000px_rgba(0,0,0,0.3)] sm:h-64 sm:w-64">
                                                    <div className="absolute inset-0 animate-pulse rounded-3xl border-2 border-blue-400" />
                                                    {/* Corner brackets */}
                                                    <div className="absolute -top-1 -left-1 h-7 w-7 rounded-tl-xl border-t-4 border-l-4 border-blue-500" />
                                                    <div className="absolute -top-1 -right-1 h-7 w-7 rounded-tr-xl border-t-4 border-r-4 border-blue-500" />
                                                    <div className="absolute -bottom-1 -left-1 h-7 w-7 rounded-bl-xl border-b-4 border-l-4 border-blue-500" />
                                                    <div className="absolute -right-1 -bottom-1 h-7 w-7 rounded-br-xl border-r-4 border-b-4 border-blue-500" />

                                                    {/* Sweeping Laser Line Animation */}
                                                    {scanState.status === 'running' && (
                                                        <div className="absolute top-0 left-0 h-1 w-full animate-scan-line bg-gradient-to-r from-transparent via-blue-400 to-transparent shadow-[0_0_20px_rgba(96,165,250,1)]" />
                                                    )}
                                                </div>
                                            </div>

                                            {/* Status / Last Scanned Overlay Banner */}
                                            {lastScanned ? (
                                                <div
                                                    className={cn(
                                                        'absolute inset-x-0 bottom-0 px-6 py-4 text-center font-bold text-white backdrop-blur-md transition-all duration-300',
                                                        lastScanned.status === 'valid'
                                                            ? 'bg-emerald-600/90'
                                                            : lastScanned.status === 'late'
                                                              ? 'bg-amber-600/90'
                                                              : 'bg-rose-600/90',
                                                    )}
                                                >
                                                    <p className="text-sm">
                                                        {lastScanned.status === 'valid'
                                                            ? '✓ Check-In Confirmed'
                                                            : lastScanned.status === 'late'
                                                              ? '⏱ Late Check-In Recorded'
                                                              : '✗ Invalid Scan'}
                                                    </p>
                                                    <p className="text-xs font-medium text-white/90">
                                                        {lastScanned.studentName ? `${lastScanned.studentName} — ` : ''}
                                                        {lastScanned.message}
                                                    </p>
                                                </div>
                                            ) : (
                                                <div className="absolute inset-x-0 bottom-0 bg-slate-950/70 px-6 py-3 text-center text-xs font-medium text-white/80 backdrop-blur-sm">
                                                    Position the QR code inside the frame to scan automatically
                                                </div>
                                            )}
                                        </div>

                                        {/* Camera Controls Bar */}
                                        <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
                                            <div className="flex items-center gap-2">
                                                <Button
                                                    type="button"
                                                    size="sm"
                                                    className="h-9 gap-2 rounded-xl bg-emerald-600 font-bold text-white hover:bg-emerald-700"
                                                    onClick={() => void startScanner()}
                                                    disabled={
                                                        event.scannerPortalActive === false ||
                                                        scanBlocked ||
                                                        isScannerBlocked ||
                                                        scanState.status === 'starting' ||
                                                        scanState.status === 'running'
                                                    }
                                                >
                                                    <Camera className="h-4 w-4" />
                                                    {scanState.status === 'running' ? 'Camera Active' : 'Start Camera'}
                                                </Button>

                                                <Button
                                                    type="button"
                                                    size="sm"
                                                    variant="outline"
                                                    className="h-9 rounded-xl font-semibold"
                                                    onClick={stopScanner}
                                                    disabled={scanState.status !== 'running' && scanState.status !== 'starting'}
                                                >
                                                    Stop Camera
                                                </Button>
                                            </div>

                                            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
                                                Sound feedback enabled on all scans
                                            </span>
                                        </div>
                                    </CardContent>
                                </Card>
                            </div>

                            {/* Right Column: Manual Fallback & Station Summary (4/12) */}
                            <div className="flex flex-col gap-6 lg:col-span-4">
                                {/* Manual Entry Card */}
                                <Card className="rounded-3xl border border-slate-100 bg-white p-5 shadow-lg shadow-slate-200/50 dark:border-slate-800 dark:bg-[#0B192C]/50 dark:shadow-none">
                                    <CardHeader className="p-0 pb-4">
                                        <div className="flex items-center gap-2.5">
                                            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-blue-50 text-blue-600 dark:bg-blue-950/40 dark:text-blue-400">
                                                <QrCode className="h-4 w-4" />
                                            </div>
                                            <div>
                                                <CardTitle className="text-sm font-bold text-slate-900 dark:text-white">
                                                    Manual ID Entry Fallback
                                                </CardTitle>
                                                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                                                    If camera scanning is unavailable
                                                </p>
                                            </div>
                                        </div>
                                    </CardHeader>
                                    <CardContent className="p-0">
                                        <form onSubmit={handleManualSubmit} className="space-y-3">
                                            <div>
                                                <label className="text-[11px] font-bold text-slate-600 uppercase dark:text-slate-400">
                                                    Student ID Number
                                                </label>
                                                <Input
                                                    type="text"
                                                    placeholder="e.g. 2023-00123"
                                                    value={manualIdInput}
                                                    onChange={(e) => setManualIdInput(e.target.value)}
                                                    className="mt-1 h-9 rounded-xl border-slate-200 text-xs dark:border-slate-700"
                                                    disabled={isSubmittingManual || isScannerBlocked}
                                                />
                                            </div>
                                            <Button
                                                type="submit"
                                                className="h-9 w-full gap-2 rounded-xl bg-[#0b2d66] text-xs font-bold text-white hover:bg-blue-900 dark:bg-blue-600"
                                                disabled={isSubmittingManual || !manualIdInput.trim() || isScannerBlocked}
                                            >
                                                <CheckCircle2 className="h-3.5 w-3.5" />
                                                {isSubmittingManual ? 'Validating...' : 'Submit Attendance'}
                                            </Button>
                                        </form>
                                    </CardContent>
                                </Card>

                                {/* Station Stats Card */}
                                <Card className="rounded-3xl border border-slate-100 bg-white p-5 shadow-lg shadow-slate-200/50 dark:border-slate-800 dark:bg-[#0B192C]/50 dark:shadow-none">
                                    <CardHeader className="p-0 pb-4">
                                        <CardTitle className="text-sm font-bold text-slate-900 dark:text-white">
                                            Scanning Guidelines
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent className="space-y-3 p-0 text-xs text-slate-600 dark:text-slate-400">
                                        <div className="flex items-start gap-2.5">
                                            <div className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-blue-100 text-[10px] font-bold text-blue-700 dark:bg-blue-950 dark:text-blue-300">
                                                1
                                            </div>
                                            <p>Ensure adequate lighting and hold the student QR code steady.</p>
                                        </div>
                                        <div className="flex items-start gap-2.5">
                                            <div className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-blue-100 text-[10px] font-bold text-blue-700 dark:bg-blue-950 dark:text-blue-300">
                                                2
                                            </div>
                                            <p>A chime will sound when the scan is verified and logged.</p>
                                        </div>
                                        <div className="flex items-start gap-2.5">
                                            <div className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-blue-100 text-[10px] font-bold text-blue-700 dark:bg-blue-950 dark:text-blue-300">
                                                3
                                            </div>
                                            <p>For geofenced events, stay within the designated venue boundary.</p>
                                        </div>
                                    </CardContent>
                                </Card>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </AppShell>
    );
}
