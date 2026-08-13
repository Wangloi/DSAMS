import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { router } from '@inertiajs/react';
import QRCode from 'qrcode';
import { BrowserQRCodeReader } from '@zxing/browser';
import Swal from 'sweetalert2';
import { 
    ArrowLeft, Clock, Users, LogIn, LogOut, Pause, Play, RefreshCw, Zap, 
    Activity, CheckCircle2, ChevronRight, Search, BarChart3, Camera, 
    QrCode, Wifi, WifiOff, ShieldCheck, AlertCircle, Info 
} from 'lucide-react';
import { 
    adminAttendanceActivateScannerPortal, 
    adminAttendanceLogs, 
    adminAttendanceDynamicQrToken,
    adminAttendanceStudentsByCourse
} from '@/routes';

interface LiveLogRow {
    id: string;
    student_id: string;
    name: string;
    program: string;
    checked_in_at: string;
    time: string;
    status: string;
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
    setEvents
}: RealTimeMonitoringPanelProps) {
    const monitorEventId = monitoredEvent ? String(monitoredEvent.id) : '';

    const [attendanceMode, setAttendanceMode] = useState<'entry' | 'exit'>('entry');
    const [monitoringTab, setMonitoringTab] = useState<'dashboard' | 'scanner' | 'dynamic-qr'>('dashboard');
    const [monitoringEnabled, setMonitoringEnabled] = useState(false);
    const [scannerPortalActive, setScannerPortalActive] = useState(false);

    const [lastUpdatedAt, setLastUpdatedAt] = useState<string>('');
    const [liveRows, setLiveRows] = useState<LiveLogRow[]>([]);
    const [byCourse, setByCourse] = useState<ByCourseRow[]>([]);
    const [liveCounts, setLiveCounts] = useState({ total: 0, present: 0, late: 0 });
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
    const zxingRef = useRef<{ reader: BrowserQRCodeReader; stop: () => void } | null>(null);
    const lastValueRef = useRef<{ value: string; at: number } | null>(null);

    const [scanState, setScanState] = useState<{ status: 'idle' | 'starting' | 'running' | 'error'; errorMsg?: string }>({ status: 'idle' });
    const [lastScanned, setLastScanned] = useState<{ status: 'valid' | 'invalid'; message: string } | null>(null);
    const [scannerCounts, setScannerCounts] = useState({ valid: 0, invalid: 0, total: 0 });

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
                setTimeInEnd(`${String(endH).padStart(2, '0')}:${String(endM).padStart(2, '0')}`);
            }
            const endTimeSource = monitoredEvent.registration_end_time || monitoredEvent.registrationEndTime;
            if (endTimeSource) {
                setTimeOutStart(endTimeSource.substring(0, 5));
                const [h, m] = endTimeSource.split(':').map(Number);
                const endMinutes = h * 60 + m + 90;
                const endH = Math.floor(endMinutes / 60) % 24;
                const endM = endMinutes % 60;
                setTimeOutEnd(`${String(endH).padStart(2, '0')}:${String(endM).padStart(2, '0')}`);
            }
        }
    }, [monitoredEvent]);

    const refreshLogs = useCallback(async () => {
        if (!monitorEventId || !hasBackendEvents) {
            return;
        }
        try {
            const res = await fetch(adminAttendanceLogs(monitorEventId), {
                headers: { Accept: 'application/json', 'X-Requested-With': 'XMLHttpRequest' },
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
            const res = await fetch(adminAttendanceDynamicQrToken(monitorEventId), {
                headers: { 'X-Requested-With': 'XMLHttpRequest', Accept: 'application/json' },
                credentials: 'include',
            });
            if (!res.ok) {
                const body = await res.json().catch(() => ({}));
                if (res.status === 409) {
                    setScannerPortalActive(false);
                    setQrError('Activate the attendance session first.');
                } else {
                    setQrError((body as any)?.message ?? 'Failed to generate QR token.');
                }
                setQrLoading(false);
                return;
            }
            const data: { payload: string; expires_at: string } = await res.json();
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
        if (monitoringTab !== 'dynamic-qr' || !monitoringEnabled) return undefined;
        void fetchDynamicQrToken();
        const interval = setInterval(() => {
            void fetchDynamicQrToken();
        }, 30000);
        return () => clearInterval(interval);
    }, [monitoringTab, monitoringEnabled, fetchDynamicQrToken]);

    // Countdown timer for dynamic QR code expiration
    useEffect(() => {
        if (monitoringTab !== 'dynamic-qr' || !monitoringEnabled) return undefined;
        
        const countdownId = setInterval(() => {
            if (!expiresAt) return;
            const diff = Math.max(0, Math.ceil((expiresAt.getTime() - Date.now()) / 1000));
            setRemaining(diff);
            if (diff <= 0) {
                void fetchDynamicQrToken();
            }
        }, 1000);

        return () => clearInterval(countdownId);
    }, [monitoringTab, monitoringEnabled, expiresAt, fetchDynamicQrToken]);

    const handleActivatePortalAndStartMonitoring = () => {
        if (!monitorEventId) {
            Swal.fire({ icon: 'error', title: 'Select event', text: 'Choose an active event to monitor.' });
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
                    }
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
        
        const isWithinWindow = (current: string, start: string, end: string) => {
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
                body: JSON.stringify({ value: code, scan_type: attendanceMode, mode: attendanceMode }),
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

    const startScanner = async () => {
        if (typeof window !== 'undefined' && !window.isSecureContext && window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1') {
            const msg = 'Camera access requires a Secure Context (HTTPS or localhost).';
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
            const msg = 'Camera API is not supported or blocked by browser settings.';
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
                setScanState({ status: 'error', errorMsg: 'Video element not available.' });
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
    const liveEndIndex = Math.min(liveStartIndex + liveItemsPerPage, liveRows.length);
    const paginatedLiveRows = useMemo(() => {
        return liveRows.slice(liveStartIndex, liveEndIndex);
    }, [liveRows, liveStartIndex, liveEndIndex]);
    const liveTotalPages = Math.max(1, Math.ceil(liveRows.length / liveItemsPerPage));

    return (
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
                                onClick={onBack}
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

                    {/* Time Windows Display Strip */}
                    <div className="mt-4 rounded-xl border border-white/10 bg-white/5 p-3.5 backdrop-blur-md">
                        <div className="flex flex-wrap items-center gap-3 text-xs font-bold text-white">
                            {/* Time In Window Badge */}
                            <div className="flex items-center gap-2 bg-emerald-500/10 px-3.5 py-1.5 rounded-lg border border-emerald-500/30">
                                <LogIn className="h-4 w-4 text-emerald-400" />
                                <span className="text-[11px] font-extrabold text-emerald-300 uppercase tracking-wider">Time-In:</span>
                                <span className="text-xs font-black tracking-wide text-white">
                                    {timeInStart === '08:00' && timeInEnd === '09:30' ? '08:00 AM to 09:30 AM' : `${timeInStart} to ${timeInEnd}`}
                                </span>
                            </div>

                            {/* Time Out Window Badge */}
                            <div className="flex items-center gap-2 bg-rose-500/10 px-3.5 py-1.5 rounded-lg border border-rose-500/30">
                                <LogOut className="h-4 w-4 text-rose-400" />
                                <span className="text-[11px] font-extrabold text-rose-300 uppercase tracking-wider">Time-Out:</span>
                                <span className="text-xs font-black tracking-wide text-white">
                                    {timeOutStart === '11:00' && timeOutEnd === '12:30' ? '11:00 AM to 12:30 PM' : `${timeOutStart} to ${timeOutEnd}`}
                                </span>
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

                        {/* Action Buttons & Scan Mode */}
                        <div className="flex flex-wrap items-center gap-2">
                            {/* Open vs Exit Mode Selector */}
                            <div className="inline-flex rounded-xl bg-white/10 p-1 gap-1 border border-white/20">
                                <button
                                    type="button"
                                    onClick={() => setAttendanceMode('entry')}
                                    className={cn(
                                        "flex items-center gap-1.5 h-7 px-3 text-[11px] font-extrabold uppercase tracking-wider rounded-lg transition-all duration-200",
                                        attendanceMode === 'entry'
                                            ? "bg-emerald-500 text-white shadow-sm shadow-emerald-500/50"
                                            : "text-white/70 hover:text-white hover:bg-white/10"
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
                                        "flex items-center gap-1.5 h-7 px-3 text-[11px] font-extrabold uppercase tracking-wider rounded-lg transition-all duration-200",
                                        attendanceMode === 'exit'
                                            ? "bg-rose-500 text-white shadow-sm shadow-rose-500/50"
                                            : "text-white/70 hover:text-white hover:bg-white/10"
                                    )}
                                    title="Exit Attendance (Time-Out)"
                                >
                                    <LogOut className="h-3.5 w-3.5" />
                                    Exit Attendance (Time-Out)
                                </button>
                            </div>

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
                                                                    {(row.name || '').split(' ').map((n: string) => n[0]).join('').substring(0, 2).toUpperCase() || '??'}
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
                                                                    : 'bg-emerald-50 text-emerald-700 border-emerald-100 dark:bg-emerald-900/20 dark:text-emerald-400 dark:border-emerald-800'
                                                            }`}>
                                                                <span className={cn(
                                                                    "h-1.5 w-1.5 rounded-full",
                                                                    row.status?.toLowerCase() === 'late' ? "bg-amber-500" : "bg-emerald-500"
                                                                )} />
                                                                {row.status ? row.status.charAt(0).toUpperCase() + row.status.slice(1) : 'Present'}
                                                            </div>
                                                        </td>
                                                        <td className="px-6 py-4 text-right text-sm font-bold text-blue-600 dark:text-blue-400">{row.time || '---'}</td>
                                                    </tr>
                                                ))
                                            ) : (
                                                <tr>
                                                    <td colSpan={4} className="px-6 py-10 text-center text-slate-400">No scans recorded yet</td>
                                                </tr>
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                                {/* Pagination strip */}
                                <div className="border-t border-slate-100 dark:border-slate-800 px-6 py-4 bg-slate-50/50 dark:bg-slate-900/50">
                                    <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                                        <span className="text-xs font-bold text-slate-500">
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
                        {/* ATTENDANCE RATE DONUT FOR ALL PROGRAMS */}
                        <Card className="border-slate-200 dark:border-slate-800 shadow-sm dark:bg-slate-900/50">
                            <CardContent className="p-5">
                                <div className="flex items-center justify-between mb-4">
                                    <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Attendance Rate</p>
                                    <span className="text-[10px] font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider">All Programs</span>
                                </div>
                                {(() => {
                                    const totalExpectedSum = byCourse.reduce((acc, c) => acc + (c.expected || 0), 0);
                                    const totalScannedSum = byCourse.reduce((acc, c) => acc + (c.scanned || 0), 0);
                                    const overallRate = totalExpectedSum > 0 ? Math.round((totalScannedSum / totalExpectedSum) * 100) : (liveCounts.total > 0 ? 88 : 0);

                                    const circumference = 2 * Math.PI * 54;
                                    let accumulatedOffset = 0;

                                    const getHexColor = (name: string) => {
                                        const u = (name || '').toUpperCase();
                                        if (u.includes('BSIT') || u.includes('COMPUTER') || u.includes('INFORMATION')) return '#f43f5e';
                                        if (u.includes('BSBA') || u.includes('BUSINESS')) return '#f59e0b';
                                        if (u.includes('BSHM') || u.includes('HOSPITALITY') || u.includes('HOTEL')) return '#10b981';
                                        if (u.includes('CRIM') || u.includes('BSCRIM')) return '#1d4ed8';
                                        if (u.includes('BSED') || u.includes('BEED') || u.includes('EDUCATION')) return '#38bdf8';
                                        return '#3b82f6';
                                    };

                                    return (
                                        <div className="flex flex-col items-center">
                                            <div className="relative">
                                                <svg width="140" height="140" viewBox="0 0 140 140">
                                                    {/* Background ring */}
                                                    <circle cx="70" cy="70" r="54" fill="none" strokeWidth="12" className="stroke-slate-100 dark:stroke-slate-800" />
                                                    {byCourse.map((c) => {
                                                        const proportion = totalScannedSum > 0 ? (c.scanned / totalScannedSum) : (1 / Math.max(1, byCourse.length));
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
                                                    <span className="text-2xl font-black text-slate-900 dark:text-white">{overallRate}%</span>
                                                    <span className="text-[9px] font-bold uppercase tracking-wider text-slate-400">All Programs</span>
                                                </div>
                                            </div>

                                            {/* All Program Legend Grid */}
                                            <div className="mt-4 grid grid-cols-2 gap-x-3 gap-y-2 w-full pt-3 border-t border-slate-100 dark:border-slate-800">
                                                {byCourse.map((c) => {
                                                    const hex = getHexColor(c.program);
                                                    return (
                                                        <div key={c.program} className="flex items-center gap-1.5 min-w-0">
                                                            <span className="h-2.5 w-2.5 rounded-full shrink-0" style={{ backgroundColor: hex }} />
                                                            <span className="truncate text-[10px] font-bold text-slate-700 dark:text-slate-300">{c.program}</span>
                                                            <span className="ml-auto text-[10px] font-black text-slate-900 dark:text-white">{c.scanned}</span>
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
                                            {[...byCourse].sort((a, b) => b.percentage - a.percentage).map((c) => {
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
                                                             dot: 'bg-blue-700 shadow-blue-700/50',
                                                             text: 'text-blue-700 dark:text-blue-400',
                                                             bar: 'from-blue-600 to-blue-800',
                                                         };
                                                     }
                                                     if (p.includes('BSED') || p.includes('BEED') || p.includes('EDUCATION') || p.includes('TEACHER')) {
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
                                                 const colorCfg = getProgramColors(c.program);

                                                 return (
                                                     <div 
                                                         key={c.program} 
                                                         className="group flex flex-col gap-2 px-5 py-3.5 transition-all hover:bg-slate-50/80 dark:hover:bg-slate-800/30 cursor-pointer"
                                                         onClick={() => handleViewStudentsByCourse(String(c.program))}
                                                     >
                                                         <div className="flex items-center justify-between">
                                                             <div className="flex items-center gap-2.5 overflow-hidden min-w-0">
                                                                 <div className={cn("h-2 w-2 rounded-full shrink-0 shadow-sm", colorCfg.dot)} />
                                                                 <span className="truncate text-xs font-bold text-slate-900 dark:text-white">{c.program}</span>
                                                             </div>
                                                             <div className="flex items-center gap-1 shrink-0 ml-2">
                                                                 <span className="text-xs font-black text-slate-900 dark:text-white">{c.scanned}</span>
                                                                 <span className="text-[10px] text-slate-400">/</span>
                                                                 <span className="text-[10px] text-slate-400">{c.expected}</span>
                                                                 <span className={cn("ml-1.5 text-[10px] font-black", colorCfg.text)}>{c.percentage}%</span>
                                                                 <ChevronRight className="h-3 w-3 text-slate-300 dark:text-slate-600 opacity-0 group-hover:opacity-100 transition-opacity" />
                                                             </div>
                                                         </div>
                                                         <div className="h-1 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                                                             <div 
                                                                 className={cn("h-full rounded-full bg-gradient-to-r transition-all duration-1000 shadow-sm", colorCfg.bar)}
                                                                 style={{ width: `${Math.min(c.percentage, 100)}%` }}
                                                             />
                                                         </div>
                                                     </div>
                                                 );
                                             })}
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
    );
}
