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
    Eye,
    Info,
    Layers,
    LogIn,
    LogOut,
    MapPin,
    Pause,
    Percent,
    Play,
    QrCode,
    RefreshCw,
    Search,
    ShieldAlert,
    ShieldCheck,
    Sparkles,
    SwitchCamera,
    Users,
    Volume2,
    VolumeX,
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

    // Active View Tab: 'scanner' | 'dashboard' | 'split'
    const [activeTab, setActiveTab] = useState<'scanner' | 'dashboard' | 'split'>('scanner');
    const [attendanceMode, setAttendanceMode] = useState<'entry' | 'exit'>('entry');
    const [monitoringEnabled, setMonitoringEnabled] = useState(true);
    const [cameraFacing, setCameraFacing] = useState<'environment' | 'user'>('environment');

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
    const itemsPerPage = 7;

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
        studentId?: string;
        timestamp?: string;
    } | null>(null);
    const [manualIdInput, setManualIdInput] = useState('');
    const [isSubmittingManual, setIsSubmittingManual] = useState(false);

    // Security & Block status
    const [securityAlerts, setSecurityAlerts] = useState<SecurityAlert[]>(initialSecurityAlerts);
    const [scannerRemaining, setScannerRemaining] = useState<number | null>(null);

    // Attendance Rate calculations
    const totalExpectedStudents = useMemo(() => {
        const fromPrograms = Object.values(studentsByProgram).reduce((a, b) => a + Number(b || 0), 0);
        if (fromPrograms > 0) return fromPrograms;
        const fromByCourse = byCourse.reduce((acc, c) => acc + Number(c.expected || 0), 0);
        if (fromByCourse > 0) return fromByCourse;
        return liveCounts.total;
    }, [studentsByProgram, byCourse, liveCounts.total]);

    const attendanceRate = useMemo(() => {
        if (totalExpectedStudents <= 0) return liveCounts.total > 0 ? 100 : 0;
        return Math.min(100, Math.round((liveCounts.total / totalExpectedStudents) * 100));
    }, [liveCounts.total, totalExpectedStudents]);

    const onTimeRate = useMemo(() => {
        if (liveCounts.total <= 0) return 0;
        return Math.round((liveCounts.present / liveCounts.total) * 100);
    }, [liveCounts.present, liveCounts.total]);

    const lateRate = useMemo(() => {
        if (liveCounts.total <= 0) return 0;
        return Math.round((liveCounts.late / liveCounts.total) * 100);
    }, [liveCounts.late, liveCounts.total]);

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
                title: 'Scanner Portal Notice',
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
    const stopScanner = useCallback(() => {
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
    }, []);

    // Attendance Scan Processor
    const handleScanSubmission = async (rawValue: string) => {
        const value = String(rawValue ?? '').trim();
        if (!value) return;

        const now = Date.now();
        if (
            lastValueRef.current?.value === value &&
            now - lastValueRef.current.at < 1800
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
                }),
            });

            const payload = await res.json().catch(() => ({}) as any);

            if (!res.ok) {
                playScanErrorSound();
                const errMsg = String(payload?.message ?? 'Attendance scan rejected.');
                setLastScanned({
                    status: 'invalid',
                    message: errMsg,
                    timestamp: new Date().toLocaleTimeString(),
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
            const studentIdNumber = String(payload?.student?.student_id ?? '');
            const statusType = isLate ? 'late' : 'valid';

            setLastScanned({
                status: statusType,
                message: payload?.message || `Attendance verified (${isLate ? 'Late' : 'On-Time'})`,
                studentName,
                studentId: studentIdNumber,
                timestamp: new Date().toLocaleTimeString(),
            });

            void refreshLogs();
            setTimeout(() => setLastScanned(null), 5000);
        } catch (err: any) {
            playScanErrorSound();
            setLastScanned({
                status: 'invalid',
                message: err?.message || 'Network connection failed.',
                timestamp: new Date().toLocaleTimeString(),
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
    const startScanner = useCallback(async () => {
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
                video: { facingMode: { ideal: cameraFacing } },
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
                }, 220);
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
                message: err?.message ?? 'Unable to activate camera device.',
            });
        }
    }, [event.scannerPortalActive, scanBlocked, cameraFacing, barcodeDetectorSupported, stopScanner]);

    // Flip Camera helper
    const toggleCameraFacing = () => {
        setCameraFacing((prev) => (prev === 'environment' ? 'user' : 'environment'));
    };

    // Auto-restart camera when facing mode changes or tab switches
    useEffect(() => {
        if (activeTab === 'scanner' || activeTab === 'split') {
            const timeout = setTimeout(() => {
                void startScanner();
            }, 120);
            return () => {
                clearTimeout(timeout);
                stopScanner();
            };
        } else {
            stopScanner();
        }
    }, [activeTab, cameraFacing, startScanner, stopScanner]);

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
            <Head title={`Attendance Scanner — ${event.name}`} />

            <div className="relative min-h-screen overflow-x-hidden bg-slate-50 font-sans text-slate-900 transition-colors duration-500 pb-20 dark:bg-[#020617] dark:text-white">
                {/* Background Ambient Mesh Highlights */}
                <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
                    <div className="absolute top-[-10%] left-[-10%] h-[50%] w-[50%] rounded-full bg-blue-600/10 mix-blend-multiply blur-[130px] dark:bg-blue-600/5 dark:mix-blend-soft-light" />
                    <div className="absolute right-[-10%] bottom-[-10%] h-[50%] w-[50%] rounded-full bg-indigo-600/10 mix-blend-multiply blur-[130px] dark:bg-indigo-600/5 dark:mix-blend-soft-light" />
                    <div className="absolute top-[30%] right-[15%] h-[30%] w-[30%] rounded-full bg-emerald-600/5 blur-[100px]" />
                </div>

                <div className="relative z-10 mx-auto flex w-full max-w-7xl flex-col gap-6 px-4 pt-6 sm:px-6 lg:px-8">
                    
                    {/* ══════════════════════════════════════════════════════════════
                        HERO HEADER: DSAMS NAVY SIGNATURE GRADIENT BANNER
                    ══════════════════════════════════════════════════════════════ */}
                    <div className="relative overflow-hidden rounded-3xl border border-blue-900/30 bg-gradient-to-r from-[#0b2d66] via-[#103875] to-[#1e40af] p-6 text-white shadow-xl sm:p-8">
                        {/* Glow ambient highlights */}
                        <div className="pointer-events-none absolute -top-24 -right-24 h-80 w-80 rounded-full bg-white/10 blur-3xl" />
                        <div className="pointer-events-none absolute -bottom-24 -left-24 h-80 w-80 rounded-full bg-cyan-400/15 blur-3xl" />

                        <div className="relative z-10 flex flex-col justify-between gap-6 lg:flex-row lg:items-center">
                            {/* Left Event Details */}
                            <div className="space-y-3.5">
                                <div className="flex flex-wrap items-center gap-2.5">
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        className="h-8 gap-2 rounded-xl border border-white/20 bg-white/10 px-3 text-xs font-bold text-white backdrop-blur-md transition-all hover:bg-white/20 hover:text-white"
                                        asChild
                                    >
                                        <Link href={studentDashboard()}>
                                            <ArrowLeft className="h-3.5 w-3.5" />
                                            Back to Dashboard
                                        </Link>
                                    </Button>

                                    <div className="inline-flex items-center gap-2 rounded-full border border-blue-300/30 bg-white/15 px-3.5 py-1 text-[11px] font-black tracking-wider text-blue-100 uppercase backdrop-blur-md">
                                        <span className="relative flex h-2 w-2">
                                            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                                            <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-400" />
                                        </span>
                                        <span>Assigned Scanner Portal</span>
                                    </div>

                                    {event.scannerPortalActive === false ? (
                                        <Badge variant="outline" className="border-rose-400/40 bg-rose-500/20 px-2.5 py-0.5 text-[10px] font-black tracking-widest text-rose-100 uppercase">
                                            Portal Paused
                                        </Badge>
                                    ) : (
                                        <Badge variant="outline" className="border-emerald-400/40 bg-emerald-500/20 px-2.5 py-0.5 text-[10px] font-black tracking-widest text-emerald-100 uppercase">
                                            Active Session
                                        </Badge>
                                    )}

                                    {isScannerBlocked && (
                                        <Badge variant="destructive" className="animate-pulse bg-rose-600 px-2.5 py-0.5 text-[10px] font-black text-white">
                                            Cooldown ({scannerRemaining}s)
                                        </Badge>
                                    )}
                                </div>

                                <div>
                                    <h1 className="text-2xl font-black tracking-tight text-white drop-shadow-md sm:text-3xl lg:text-4xl">
                                        {event.name}
                                    </h1>
                                    <p className="mt-1 text-xs font-semibold text-blue-100/90 sm:text-sm">
                                        Official Student Real-Time Attendance Monitoring & Scanner Station
                                    </p>
                                </div>

                                {/* Event Info Chips */}
                                <div className="flex flex-wrap items-center gap-2 text-xs">
                                    <span className="inline-flex items-center gap-1.5 rounded-xl border border-white/20 bg-white/10 px-3 py-1 font-semibold text-white backdrop-blur-md">
                                        <Clock className="h-3.5 w-3.5 text-blue-200" />
                                        {event.date || 'Today'}
                                    </span>
                                    {event.timeIn && (
                                        <span className="inline-flex items-center gap-1.5 rounded-xl border border-white/20 bg-white/10 px-3 py-1 font-semibold text-white backdrop-blur-md">
                                            <LogIn className="h-3.5 w-3.5 text-emerald-300" />
                                            In: {formatTime12h(event.timeIn)}
                                        </span>
                                    )}
                                    {event.timeEnd && (
                                        <span className="inline-flex items-center gap-1.5 rounded-xl border border-white/20 bg-white/10 px-3 py-1 font-semibold text-white backdrop-blur-md">
                                            <LogOut className="h-3.5 w-3.5 text-rose-300" />
                                            Out: {formatTime12h(event.timeEnd)}
                                        </span>
                                    )}
                                    {event.location && (
                                        <span className="inline-flex items-center gap-1.5 rounded-xl border border-white/20 bg-white/10 px-3 py-1 font-semibold text-white backdrop-blur-md">
                                            <MapPin className="h-3.5 w-3.5 text-cyan-200" />
                                            {event.location}
                                        </span>
                                    )}
                                </div>
                            </div>

                            {/* Right Controls: Mode Toggle & Sync Control */}
                            <div className="flex flex-col items-start gap-3 sm:flex-row sm:items-center lg:flex-col lg:items-end">
                                {/* Time-In / Time-Out Mode Pill */}
                                <div className="inline-flex gap-1 rounded-2xl border border-white/20 bg-black/30 p-1.5 shadow-inner backdrop-blur-xl">
                                    <button
                                        type="button"
                                        onClick={() => setAttendanceMode('entry')}
                                        className={cn(
                                            'flex h-9 items-center gap-2 rounded-xl px-4 text-xs font-black tracking-wider uppercase transition-all duration-300',
                                            attendanceMode === 'entry'
                                                ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/40 ring-2 ring-emerald-300/60'
                                                : 'text-white/80 hover:bg-white/10 hover:text-white',
                                        )}
                                    >
                                        <LogIn className="h-4 w-4" />
                                        Time-In Mode
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setAttendanceMode('exit')}
                                        className={cn(
                                            'flex h-9 items-center gap-2 rounded-xl px-4 text-xs font-black tracking-wider uppercase transition-all duration-300',
                                            attendanceMode === 'exit'
                                                ? 'bg-rose-500 text-white shadow-lg shadow-rose-500/40 ring-2 ring-rose-300/60'
                                                : 'text-white/80 hover:bg-white/10 hover:text-white',
                                        )}
                                    >
                                        <LogOut className="h-4 w-4" />
                                        Time-Out Mode
                                    </button>
                                </div>

                                {/* Sync & Polling Controls */}
                                <div className="flex items-center gap-2">
                                    <Button
                                        type="button"
                                        size="sm"
                                        className={cn(
                                            'h-9 gap-2 rounded-xl px-4 text-xs font-bold transition-all duration-200 active:scale-95',
                                            monitoringEnabled
                                                ? 'border border-white/25 bg-white/15 text-white hover:bg-white/25 backdrop-blur-md'
                                                : 'bg-white text-slate-900 shadow-md hover:bg-slate-100',
                                        )}
                                        onClick={() => setMonitoringEnabled((prev) => !prev)}
                                    >
                                        {monitoringEnabled ? (
                                            <>
                                                <Pause className="h-3.5 w-3.5 fill-current text-emerald-300" />
                                                <span>Live Stream Active</span>
                                            </>
                                        ) : (
                                            <>
                                                <Play className="h-3.5 w-3.5 fill-current text-blue-600" />
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
                                            className={`h-4 w-4 ${monitoringEnabled ? 'animate-[spin_4s_linear_infinite]' : ''}`}
                                        />
                                    </Button>
                                </div>
                            </div>
                        </div>

                        {/* Security Alert Banner if any */}
                        {securityAlerts.length > 0 && (
                            <div className="mt-4 flex items-start gap-3 rounded-2xl border border-rose-300/30 bg-rose-950/50 p-3.5 text-xs text-rose-100 backdrop-blur-xl">
                                <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0 text-rose-300" />
                                <div>
                                    <span className="font-black text-rose-200">Security Guard Active: </span>
                                    {securityAlerts[0].recent_count
                                        ? `${securityAlerts[0].recent_count} unverified access attempts recorded within ${securityAlerts[0].window_minutes ?? 15} minutes.`
                                        : securityAlerts[0].details}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* ══════════════════════════════════════════════════════════════
                        KPI SUMMARY CARDS (CLEAN LIGHT/DARK RESPONSIVE)
                    ══════════════════════════════════════════════════════════════ */}
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                        {/* Stat 1: Total Checked In */}
                        <div className="group relative overflow-hidden rounded-3xl border border-slate-200/80 bg-white p-5 shadow-sm transition-all duration-300 hover:border-blue-300 hover:shadow-md dark:border-slate-800 dark:bg-[#0B192C]/70">
                            <div className="flex items-center gap-4">
                                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-blue-50 text-blue-600 ring-1 ring-blue-100 dark:bg-blue-500/20 dark:text-blue-400 dark:ring-blue-500/30">
                                    <Users className="h-6 w-6" />
                                </div>
                                <div>
                                    <p className="text-[10px] font-extrabold tracking-widest text-slate-500 uppercase dark:text-slate-400">
                                        Total Scanned
                                    </p>
                                    <p className="text-2xl font-black text-slate-900 sm:text-3xl dark:text-white">
                                        {liveCounts.total}
                                    </p>
                                    <p className="text-[11px] font-bold text-blue-600 dark:text-blue-400">
                                        Verified Attendees
                                    </p>
                                </div>
                            </div>
                            <div className="mt-4 h-1.5 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                                <div className="h-full rounded-full bg-gradient-to-r from-blue-500 to-indigo-600 w-full" />
                            </div>
                        </div>

                        {/* Stat 2: On Time */}
                        <div className="group relative overflow-hidden rounded-3xl border border-slate-200/80 bg-white p-5 shadow-sm transition-all duration-300 hover:border-emerald-300 hover:shadow-md dark:border-slate-800 dark:bg-[#0B192C]/70">
                            <div className="flex items-center gap-4">
                                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600 ring-1 ring-emerald-100 dark:bg-emerald-500/20 dark:text-emerald-400 dark:ring-emerald-500/30">
                                    <CheckCircle2 className="h-6 w-6" />
                                </div>
                                <div>
                                    <p className="text-[10px] font-extrabold tracking-widest text-emerald-600 uppercase dark:text-emerald-400">
                                        On Time Scans
                                    </p>
                                    <p className="text-2xl font-black text-emerald-700 sm:text-3xl dark:text-emerald-300">
                                        {liveCounts.present}
                                    </p>
                                    <p className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400">
                                        Prompt Arrivals
                                    </p>
                                </div>
                            </div>
                            <div className="mt-4 h-1.5 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                                <div
                                    className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-teal-500 transition-all duration-500"
                                    style={{
                                        width: `${liveCounts.total > 0 ? (liveCounts.present / liveCounts.total) * 100 : 100}%`,
                                    }}
                                />
                            </div>
                        </div>

                        {/* Stat 3: Late Arrivals */}
                        <div className="group relative overflow-hidden rounded-3xl border border-slate-200/80 bg-white p-5 shadow-sm transition-all duration-300 hover:border-rose-300 hover:shadow-md dark:border-slate-800 dark:bg-[#0B192C]/70">
                            <div className="flex items-center gap-4">
                                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-rose-50 text-rose-600 ring-1 ring-rose-100 dark:bg-rose-500/20 dark:text-rose-400 dark:ring-rose-500/30">
                                    <Clock className="h-6 w-6" />
                                </div>
                                <div>
                                    <p className="text-[10px] font-extrabold tracking-widest text-rose-600 uppercase dark:text-rose-400">
                                        Late Check-Ins
                                    </p>
                                    <p className="text-2xl font-black text-rose-700 sm:text-3xl dark:text-rose-300">
                                        {liveCounts.late}
                                    </p>
                                    <p className="text-[11px] font-bold text-rose-600 dark:text-rose-400">
                                        Tardy Scans
                                    </p>
                                </div>
                            </div>
                            <div className="mt-4 h-1.5 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                                <div
                                    className="h-full rounded-full bg-gradient-to-r from-rose-500 to-amber-500 transition-all duration-500"
                                    style={{
                                        width: `${liveCounts.total > 0 ? (liveCounts.late / liveCounts.total) * 100 : 0}%`,
                                    }}
                                />
                            </div>
                        </div>
                    </div>

                    {/* ══════════════════════════════════════════════════════════════
                        TAB NAVIGATION BAR
                    ══════════════════════════════════════════════════════════════ */}
                    <div className="flex flex-wrap items-center justify-between gap-3">
                        <div className="inline-flex rounded-2xl border border-slate-200/80 bg-white p-1.5 shadow-sm backdrop-blur-xl dark:border-slate-800 dark:bg-slate-900/90">
                            <button
                                type="button"
                                onClick={() => setActiveTab('scanner')}
                                className={cn(
                                    'flex items-center gap-2 rounded-xl px-5 py-2.5 text-xs font-black tracking-wider uppercase transition-all duration-300',
                                    activeTab === 'scanner'
                                        ? 'bg-[#0b2d66] text-white shadow-md shadow-blue-950/20 dark:bg-blue-600'
                                        : 'text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800',
                                )}
                            >
                                <Camera className="h-4 w-4" />
                                Camera Scanner
                            </button>
                            <button
                                type="button"
                                onClick={() => setActiveTab('dashboard')}
                                className={cn(
                                    'flex items-center gap-2 rounded-xl px-5 py-2.5 text-xs font-black tracking-wider uppercase transition-all duration-300',
                                    activeTab === 'dashboard'
                                        ? 'bg-[#0b2d66] text-white shadow-md shadow-blue-950/20 dark:bg-blue-600'
                                        : 'text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800',
                                )}
                            >
                                <BarChart3 className="h-4 w-4" />
                                Logs & Overview
                            </button>
                            <button
                                type="button"
                                onClick={() => setActiveTab('split')}
                                className={cn(
                                    'hidden md:flex items-center gap-2 rounded-xl px-5 py-2.5 text-xs font-black tracking-wider uppercase transition-all duration-300',
                                    activeTab === 'split'
                                        ? 'bg-[#0b2d66] text-white shadow-md shadow-blue-950/20 dark:bg-blue-600'
                                        : 'text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800',
                                )}
                            >
                                <Layers className="h-4 w-4" />
                                Split View
                            </button>
                        </div>

                        {lastUpdatedAt && (
                            <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 dark:text-slate-400">
                                <Activity className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" />
                                <span>Synced at: {lastUpdatedAt}</span>
                            </div>
                        )}
                    </div>

                    {/* ══════════════════════════════════════════════════════════════
                        TAB VIEW: SCANNER ONLY OR SPLIT VIEW
                    ══════════════════════════════════════════════════════════════ */}
                    {(activeTab === 'scanner' || activeTab === 'split') && (
                        <div className={cn('grid grid-cols-1 gap-6', activeTab === 'split' ? 'lg:grid-cols-12' : '')}>
                            {/* Camera Viewport Container */}
                            <div className={cn('flex flex-col gap-6', activeTab === 'split' ? 'lg:col-span-6' : 'max-w-4xl mx-auto w-full')}>
                                <div className="overflow-hidden rounded-3xl border border-slate-200/80 bg-white shadow-sm transition-all dark:border-slate-800 dark:bg-[#0B192C]/70">
                                    {/* Viewport Header */}
                                    <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50/70 px-6 py-4 dark:border-slate-800 dark:bg-slate-900/60">
                                        <div className="flex items-center gap-3">
                                            <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-blue-50 text-blue-600 dark:bg-blue-500/20 dark:text-blue-400">
                                                <Camera className="h-4 w-4" />
                                            </div>
                                            <div>
                                                <h3 className="text-sm font-black text-slate-900 dark:text-white">
                                                    Live Camera Scanner
                                                </h3>
                                                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                                                    Align student QR code within frame
                                                </p>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-2">
                                            <Button
                                                type="button"
                                                variant="outline"
                                                size="sm"
                                                onClick={toggleCameraFacing}
                                                className="h-8 gap-1.5 rounded-xl border-slate-200 text-xs text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
                                                title="Switch Camera (Front/Rear)"
                                            >
                                                <SwitchCamera className="h-3.5 w-3.5" />
                                                <span className="hidden sm:inline">{cameraFacing === 'environment' ? 'Rear Camera' : 'Front Camera'}</span>
                                            </Button>

                                            {scanState.status === 'running' ? (
                                                <Badge className="bg-emerald-600 text-white font-black text-[10px] tracking-wider">
                                                    LIVE
                                                </Badge>
                                            ) : scanState.status === 'starting' ? (
                                                <Badge className="bg-amber-500 text-white font-black text-[10px] tracking-wider">
                                                    STARTING
                                                </Badge>
                                            ) : (
                                                <Badge variant="outline" className="border-slate-300 text-slate-600 font-bold text-[10px] dark:border-slate-700 dark:text-slate-400">
                                                    IDLE
                                                </Badge>
                                            )}
                                        </div>
                                    </div>

                                    {/* Camera Video Reticle Viewport */}
                                    <div className="p-6 space-y-4">
                                        <div className="relative aspect-[16/10] w-full overflow-hidden rounded-3xl border border-slate-800 bg-black shadow-2xl">
                                            <video
                                                ref={videoRef}
                                                className="absolute inset-0 h-full w-full object-cover"
                                                playsInline
                                                muted
                                            />

                                            {/* High-Tech Futuristic Reticle Frame */}
                                            <div className="pointer-events-none absolute inset-0">
                                                <div className="absolute inset-0 bg-black/40" />
                                                
                                                {/* Focus Box */}
                                                <div className="absolute top-1/2 left-1/2 h-56 w-56 -translate-x-1/2 -translate-y-1/2 rounded-3xl border border-blue-400/30 shadow-[0_0_0_1000px_rgba(0,0,0,0.45)] sm:h-64 sm:w-64">
                                                    {/* Corner Neon Reticles */}
                                                    <div className="absolute -top-1.5 -left-1.5 h-8 w-8 rounded-tl-2xl border-t-4 border-l-4 border-cyan-400 shadow-[0_0_10px_rgba(34,211,238,0.8)]" />
                                                    <div className="absolute -top-1.5 -right-1.5 h-8 w-8 rounded-tr-2xl border-t-4 border-r-4 border-cyan-400 shadow-[0_0_10px_rgba(34,211,238,0.8)]" />
                                                    <div className="absolute -bottom-1.5 -left-1.5 h-8 w-8 rounded-bl-2xl border-b-4 border-l-4 border-cyan-400 shadow-[0_0_10px_rgba(34,211,238,0.8)]" />
                                                    <div className="absolute -bottom-1.5 -right-1.5 h-8 w-8 rounded-br-2xl border-r-4 border-b-4 border-cyan-400 shadow-[0_0_10px_rgba(34,211,238,0.8)]" />

                                                    {/* Crosshair Center */}
                                                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-4 w-4">
                                                        <div className="absolute top-1/2 left-0 right-0 h-[1px] bg-cyan-400/60" />
                                                        <div className="absolute top-0 bottom-0 left-1/2 w-[1px] bg-cyan-400/60" />
                                                    </div>

                                                    {/* Animated Laser Sweep Line */}
                                                    {scanState.status === 'running' && (
                                                        <div className="absolute top-0 left-0 h-1 w-full animate-scan-line bg-gradient-to-r from-transparent via-cyan-400 to-transparent shadow-[0_0_15px_rgba(34,211,238,1)]" />
                                                    )}
                                                </div>
                                            </div>

                                            {/* Flash Notification Result Card on Scan */}
                                            {lastScanned ? (
                                                <div
                                                    className={cn(
                                                        'absolute inset-x-0 bottom-0 p-5 text-center font-bold text-white backdrop-blur-xl transition-all duration-300 animate-in fade-in slide-in-from-bottom-4',
                                                        lastScanned.status === 'valid'
                                                            ? 'bg-emerald-600/95 border-t border-emerald-400/40 shadow-[0_-10px_30px_rgba(16,185,129,0.3)]'
                                                            : lastScanned.status === 'late'
                                                              ? 'bg-amber-600/95 border-t border-amber-400/40 shadow-[0_-10px_30px_rgba(245,158,11,0.3)]'
                                                              : 'bg-rose-600/95 border-t border-rose-400/40 shadow-[0_-10px_30px_rgba(225,29,72,0.3)]',
                                                    )}
                                                >
                                                    <div className="flex items-center justify-center gap-2 mb-1">
                                                        {lastScanned.status === 'valid' ? (
                                                            <CheckCircle2 className="h-5 w-5" />
                                                        ) : lastScanned.status === 'late' ? (
                                                            <Clock className="h-5 w-5" />
                                                        ) : (
                                                            <AlertCircle className="h-5 w-5" />
                                                        )}
                                                        <span className="text-base font-black uppercase tracking-wider">
                                                            {lastScanned.status === 'valid'
                                                                ? 'Attendance Recorded (On-Time)'
                                                                : lastScanned.status === 'late'
                                                                  ? 'Attendance Recorded (Late)'
                                                                  : 'Scan Rejected'}
                                                        </span>
                                                    </div>
                                                    <p className="text-sm font-extrabold text-white">
                                                        {lastScanned.studentName}
                                                        {lastScanned.studentId ? ` (${lastScanned.studentId})` : ''}
                                                    </p>
                                                    <p className="text-xs font-medium text-white/90 mt-0.5">
                                                        {lastScanned.message} • {lastScanned.timestamp}
                                                    </p>
                                                </div>
                                            ) : (
                                                <div className="absolute inset-x-0 bottom-0 bg-black/75 px-6 py-3 text-center text-xs font-semibold text-slate-300 backdrop-blur-md">
                                                    Position student QR code inside the cyan reticle
                                                </div>
                                            )}
                                        </div>

                                        {/* Camera Action Buttons */}
                                        <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
                                            <div className="flex items-center gap-2">
                                                <Button
                                                    type="button"
                                                    size="sm"
                                                    className="h-10 gap-2 rounded-xl bg-emerald-600 font-bold text-white hover:bg-emerald-500 active:scale-95 shadow-md shadow-emerald-600/20"
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
                                                    variant="outline"
                                                    size="sm"
                                                    className="h-10 gap-2 rounded-xl border-slate-200 font-bold text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800 active:scale-95"
                                                    onClick={stopScanner}
                                                    disabled={scanState.status === 'idle'}
                                                >
                                                    Stop Camera
                                                </Button>
                                            </div>

                                            <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 dark:text-slate-400">
                                                <Volume2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                                                <span>Audio cues enabled</span>
                                            </div>
                                        </div>

                                        {/* Manual Barcode / Student ID Input Bar */}
                                        <div className="mt-4 rounded-2xl border border-slate-200/80 bg-slate-50/70 p-4 dark:border-slate-800 dark:bg-slate-900/60">
                                            <form onSubmit={handleManualSubmit} className="flex flex-col sm:flex-row gap-2">
                                                <div className="relative flex-1">
                                                    <QrCode className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-slate-400" />
                                                    <Input
                                                        type="text"
                                                        placeholder="Enter or scan Student ID manually..."
                                                        value={manualIdInput}
                                                        onChange={(e) => setManualIdInput(e.target.value)}
                                                        className="h-10 rounded-xl border-slate-200 bg-white pl-9 text-xs font-semibold text-slate-900 placeholder:text-slate-400 focus:border-blue-500 dark:border-slate-800 dark:bg-slate-950 dark:text-white"
                                                    />
                                                </div>
                                                <Button
                                                    type="submit"
                                                    disabled={!manualIdInput.trim() || isSubmittingManual}
                                                    className="h-10 rounded-xl bg-[#0b2d66] font-bold text-white hover:bg-[#103875] dark:bg-blue-600 dark:hover:bg-blue-500 active:scale-95"
                                                >
                                                    {isSubmittingManual ? 'Processing...' : 'Submit Scan'}
                                                </Button>
                                            </form>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Split View: Live Feed on Right Column (6/12) */}
                            {activeTab === 'split' && (
                                <div className="flex flex-col gap-6 lg:col-span-6">
                                    <div className="overflow-hidden rounded-3xl border border-slate-200/80 bg-white shadow-sm dark:border-slate-800 dark:bg-[#0B192C]/70">
                                        <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50/70 px-6 py-4 dark:border-slate-800 dark:bg-slate-900/60">
                                            <div className="flex items-center gap-3">
                                                <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400">
                                                    <Activity className="h-4 w-4" />
                                                </div>
                                                <div>
                                                    <h3 className="text-sm font-black text-slate-900 dark:text-white">
                                                        Real-Time Log Stream
                                                    </h3>
                                                    <p className="text-[11px] text-slate-500 dark:text-slate-400">
                                                        Live attendee verification logs
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="relative w-40">
                                                <Search className="absolute top-1/2 left-2.5 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
                                                <Input
                                                    type="text"
                                                    placeholder="Search..."
                                                    value={searchQuery}
                                                    onChange={(e) => {
                                                        setSearchQuery(e.target.value);
                                                        setCurrentPage(1);
                                                    }}
                                                    className="h-8 rounded-xl border-slate-200 bg-white pl-7 text-[11px] text-slate-900 dark:border-slate-800 dark:bg-slate-950 dark:text-white"
                                                />
                                            </div>
                                        </div>

                                        <div className="overflow-x-auto">
                                            <table className="w-full text-left text-xs">
                                                <thead>
                                                    <tr className="border-b border-slate-100 bg-slate-50/50 text-[10px] font-black tracking-wider text-slate-500 uppercase dark:border-slate-800 dark:bg-slate-950/40 dark:text-slate-400">
                                                        <th className="px-5 py-3">Student</th>
                                                        <th className="px-3 py-3">Time</th>
                                                        <th className="px-5 py-3 text-right">Status</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                                    {paginatedRows.length === 0 ? (
                                                        <tr>
                                                            <td colSpan={3} className="px-5 py-10 text-center text-slate-400">
                                                                No attendance logs yet
                                                            </td>
                                                        </tr>
                                                    ) : (
                                                        paginatedRows.map((row, idx) => {
                                                            const isLate = row.status === 'late';
                                                            const isInvalid = row.status === 'invalid';
                                                            return (
                                                                <tr key={row.id || idx} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors">
                                                                    <td className="px-5 py-3">
                                                                        <p className="font-bold text-slate-900 dark:text-white truncate max-w-[150px]">
                                                                            {row.name}
                                                                        </p>
                                                                        <p className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">
                                                                            {row.student_id || row.id} • {row.program}
                                                                        </p>
                                                                    </td>
                                                                    <td className="px-3 py-3 font-semibold text-slate-700 dark:text-slate-300">
                                                                        {row.time || formatTime12h(row.checked_in_at)}
                                                                    </td>
                                                                    <td className="px-5 py-3 text-right">
                                                                        {isInvalid ? (
                                                                            <span className="inline-flex rounded-md bg-rose-50 px-2 py-0.5 text-[10px] font-bold text-rose-700 dark:bg-rose-500/20 dark:text-rose-300">
                                                                                Invalid
                                                                            </span>
                                                                        ) : isLate ? (
                                                                            <span className="inline-flex rounded-md bg-amber-50 px-2 py-0.5 text-[10px] font-bold text-amber-700 dark:bg-amber-500/20 dark:text-amber-300">
                                                                                Late
                                                                            </span>
                                                                        ) : (
                                                                            <span className="inline-flex rounded-md bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300">
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
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {/* ══════════════════════════════════════════════════════════════
                        TAB VIEW: DASHBOARD OVERVIEW & COMPREHENSIVE LOGS
                    ══════════════════════════════════════════════════════════════ */}
                    {activeTab === 'dashboard' && (
                        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
                            {/* Left Column: Live Activity Table (8/12) */}
                            <div className="flex flex-col gap-6 lg:col-span-8">
                                <div className="overflow-hidden rounded-3xl border border-slate-200/80 bg-white shadow-sm dark:border-slate-800 dark:bg-[#0B192C]/70">
                                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b border-slate-100 bg-slate-50/70 px-6 py-4 dark:border-slate-800 dark:bg-slate-900/60">
                                        <div className="flex items-center gap-3">
                                            <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-blue-50 text-blue-600 dark:bg-blue-500/20 dark:text-blue-400">
                                                <Activity className="h-4 w-4" />
                                            </div>
                                            <div>
                                                <h3 className="text-sm font-black text-slate-900 dark:text-white">
                                                    Live Activity Log
                                                </h3>
                                                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                                                    Streaming verified student attendance scans
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
                                                    className="h-8 rounded-xl border-slate-200 bg-white pl-8 text-xs text-slate-900 placeholder:text-slate-400 dark:border-slate-800 dark:bg-slate-950 dark:text-white"
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    <div className="overflow-x-auto">
                                        <table className="w-full text-left text-xs">
                                            <thead>
                                                <tr className="border-b border-slate-100 bg-slate-50/50 text-[10px] font-black tracking-wider text-slate-500 uppercase dark:border-slate-800 dark:bg-slate-950/40 dark:text-slate-400">
                                                    <th className="px-6 py-3.5">Student</th>
                                                    <th className="px-4 py-3.5">Program</th>
                                                    <th className="px-4 py-3.5">Time</th>
                                                    <th className="px-6 py-3.5 text-right">Status</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                                {paginatedRows.length === 0 ? (
                                                    <tr>
                                                        <td colSpan={4} className="px-6 py-12 text-center text-slate-400">
                                                            <div className="flex flex-col items-center justify-center gap-2">
                                                                <Users className="h-8 w-8 stroke-1 text-slate-400 dark:text-slate-600" />
                                                                <p className="text-sm font-bold text-slate-600 dark:text-slate-400">No attendance records found</p>
                                                                <p className="text-xs text-slate-400 dark:text-slate-500">
                                                                    {searchQuery
                                                                        ? 'No student matched your search query.'
                                                                        : 'Scanned student records will appear here in real-time.'}
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
                                                            <tr key={row.id || idx} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors">
                                                                <td className="px-6 py-3.5">
                                                                    <div className="flex items-center gap-3">
                                                                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 text-[10px] font-black text-white shadow-sm">
                                                                            {initials}
                                                                        </div>
                                                                        <div className="min-w-0">
                                                                            <p className="truncate font-bold text-slate-900 dark:text-white">
                                                                                {row.name}
                                                                            </p>
                                                                            <p className="truncate text-[11px] font-medium text-slate-500 dark:text-slate-400">
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
                                                                <td className="px-4 py-3.5 text-slate-700 dark:text-slate-300">
                                                                    <div className="flex items-center gap-1.5 font-semibold">
                                                                        <Clock className="h-3.5 w-3.5 text-slate-400" />
                                                                        {row.time || formatTime12h(row.checked_in_at)}
                                                                    </div>
                                                                </td>
                                                                <td className="px-6 py-3.5 text-right">
                                                                    {isInvalid ? (
                                                                        <span className="inline-flex items-center gap-1 rounded-full border border-rose-200 bg-rose-50 px-2.5 py-0.5 text-[10px] font-black text-rose-700 uppercase dark:border-rose-500/30 dark:bg-rose-500/15 dark:text-rose-300">
                                                                            <AlertCircle className="h-3 w-3" />
                                                                            Invalid
                                                                        </span>
                                                                    ) : isLate ? (
                                                                        <span className="inline-flex items-center gap-1 rounded-full border border-amber-200 bg-amber-50 px-2.5 py-0.5 text-[10px] font-black text-amber-700 uppercase dark:border-amber-500/30 dark:bg-amber-500/15 dark:text-amber-300">
                                                                            <Clock className="h-3 w-3" />
                                                                            Late
                                                                        </span>
                                                                    ) : (
                                                                        <span className="inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-0.5 text-[10px] font-black text-emerald-700 uppercase dark:border-emerald-500/30 dark:bg-emerald-500/15 dark:text-emerald-300">
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

                                    {/* Pagination Controls */}
                                    {filteredRows.length > itemsPerPage && (
                                        <div className="flex items-center justify-between border-t border-slate-100 bg-slate-50/60 px-6 py-3 text-xs text-slate-500 dark:border-slate-800 dark:bg-slate-900/50 dark:text-slate-400">
                                            <div>
                                                Showing {(currentPage - 1) * itemsPerPage + 1} to{' '}
                                                {Math.min(currentPage * itemsPerPage, filteredRows.length)} of{' '}
                                                {filteredRows.length} attendees
                                            </div>
                                            <div className="flex items-center gap-1.5">
                                                <Button
                                                    variant="outline"
                                                    size="icon"
                                                    className="h-7 w-7 rounded-lg border-slate-200 text-slate-700 dark:border-slate-700 dark:text-slate-300"
                                                    disabled={currentPage === 1}
                                                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                                                >
                                                    <ChevronLeft className="h-3.5 w-3.5" />
                                                </Button>
                                                <span className="px-2 font-bold text-slate-800 dark:text-white">
                                                    {currentPage} / {totalPages}
                                                </span>
                                                <Button
                                                    variant="outline"
                                                    size="icon"
                                                    className="h-7 w-7 rounded-lg border-slate-200 text-slate-700 dark:border-slate-700 dark:text-slate-300"
                                                    disabled={currentPage >= totalPages}
                                                    onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                                                >
                                                    <ChevronRight className="h-3.5 w-3.5" />
                                                </Button>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Right Column: Event Info & Program Distribution (4/12) */}
                            <div className="flex flex-col gap-6 lg:col-span-4">
                                {/* Attendance Rate Card */}
                                <div className="rounded-3xl border border-slate-200/80 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-[#0B192C]/70">
                                    <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
                                        <div className="flex items-center gap-2.5">
                                            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-blue-50 text-blue-600 dark:bg-blue-500/20 dark:text-blue-400">
                                                <Percent className="h-4 w-4" />
                                            </div>
                                            <h3 className="text-sm font-black text-slate-900 dark:text-white">
                                                Attendance Rate
                                            </h3>
                                        </div>
                                        <Badge className="bg-blue-600 font-black text-white text-[11px] px-2.5 py-0.5">
                                            {attendanceRate}% Turnout
                                        </Badge>
                                    </div>

                                    <div className="pt-4 space-y-4">
                                        <div>
                                            <div className="flex items-baseline justify-between mb-1.5">
                                                <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                                                    Attendance Progress
                                                </span>
                                                <span className="text-sm font-black text-slate-900 dark:text-white">
                                                    {liveCounts.total} / {totalExpectedStudents} ({attendanceRate}%)
                                                </span>
                                            </div>
                                            <div className="h-2.5 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                                                <div
                                                    className="h-full rounded-full bg-gradient-to-r from-blue-600 via-indigo-600 to-emerald-500 transition-all duration-500"
                                                    style={{ width: `${Math.min(100, attendanceRate)}%` }}
                                                />
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-2 gap-3 pt-1 text-xs">
                                            <div className="rounded-2xl border border-emerald-100 bg-emerald-50/50 p-3 dark:border-emerald-500/20 dark:bg-emerald-500/10">
                                                <div className="flex items-center gap-1.5 font-bold text-emerald-700 dark:text-emerald-300">
                                                    <CheckCircle2 className="h-3.5 w-3.5" />
                                                    <span>On-Time Rate</span>
                                                </div>
                                                <p className="mt-1 text-xl font-black text-emerald-800 dark:text-emerald-200">
                                                    {onTimeRate}%
                                                </p>
                                                <p className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium">
                                                    {liveCounts.present} prompt check-ins
                                                </p>
                                            </div>

                                            <div className="rounded-2xl border border-rose-100 bg-rose-50/50 p-3 dark:border-rose-500/20 dark:bg-rose-500/10">
                                                <div className="flex items-center gap-1.5 font-bold text-rose-700 dark:text-rose-300">
                                                    <Clock className="h-3.5 w-3.5" />
                                                    <span>Late Rate</span>
                                                </div>
                                                <p className="mt-1 text-xl font-black text-rose-800 dark:text-rose-200">
                                                    {lateRate}%
                                                </p>
                                                <p className="text-[10px] text-rose-600 dark:text-rose-400 font-medium">
                                                    {liveCounts.late} tardy check-ins
                                                </p>
                                            </div>
                                        </div>

                                        <div className="rounded-2xl border border-slate-100 bg-slate-50/70 p-3 text-[11px] font-semibold text-slate-600 dark:border-slate-800 dark:bg-slate-900/60 dark:text-slate-400 space-y-1.5">
                                            <div className="flex items-center justify-between">
                                                <span>Check-In Window:</span>
                                                <span className="font-bold text-slate-900 dark:text-white">
                                                    {formatTime12h(event.timeIn)} - {formatTime12h(event.timeEnd)}
                                                </span>
                                            </div>
                                            <div className="flex items-center justify-between">
                                                <span>Venue:</span>
                                                <span className="font-bold text-slate-900 dark:text-white">
                                                    {event.location || 'Campus'}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Program Distribution Card */}
                                <div className="rounded-3xl border border-slate-200/80 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-[#0B192C]/70">
                                    <div className="flex items-center gap-2.5 pb-4 border-b border-slate-100 dark:border-slate-800">
                                        <div className="flex h-8 w-8 items-center justify-center rounded-2xl bg-blue-50 text-blue-600 dark:bg-blue-500/20 dark:text-blue-400">
                                            <BarChart3 className="h-4 w-4" />
                                        </div>
                                        <h3 className="text-sm font-black text-slate-900 dark:text-white">
                                            Department Turnout
                                        </h3>
                                    </div>
                                    <div className="space-y-3.5 pt-4">
                                        {byCourse.length === 0 ? (
                                            <p className="text-xs text-slate-400">
                                                Department metrics will compute automatically as scans are processed.
                                            </p>
                                        ) : (
                                            byCourse.map((item, i) => (
                                                <div key={i} className="space-y-1.5 text-xs">
                                                    <div className="flex justify-between font-bold">
                                                        <span className="text-slate-700 dark:text-slate-200">{item.program}</span>
                                                        <span className="text-blue-600 dark:text-blue-400">
                                                            {item.scanned} ({item.percentage}%)
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
                                    </div>
                                </div>

                                {/* Scanner Access Security Card */}
                                <div className="rounded-3xl border border-blue-200/60 bg-gradient-to-br from-blue-50/60 to-indigo-50/40 p-5 shadow-sm dark:border-blue-500/20 dark:bg-[#0B192C]/50">
                                    <div className="flex items-start gap-3">
                                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl bg-[#0b2d66] text-white shadow-md shadow-blue-900/20 dark:bg-blue-600">
                                            <ShieldCheck className="h-4 w-4" />
                                        </div>
                                        <div className="space-y-1 text-xs">
                                            <p className="font-black text-slate-900 dark:text-white">
                                                Student Attendance Guard
                                            </p>
                                            <p className="leading-relaxed text-slate-600 dark:text-slate-400 font-medium">
                                                Assigned scanner access is verified against event security keys and attendee enrollment parameters.
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                </div>
            </div>
        </AppShell>
    );
}
