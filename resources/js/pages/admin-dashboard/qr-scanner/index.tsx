import { Head, Link, router } from '@inertiajs/react';
import { BrowserQRCodeReader } from '@zxing/browser';
import { 
    ArrowLeft, 
    BarChart3, 
    Calendar, 
    CalendarDays, 
    Clock, 
    Eye, 
    MapPin, 
    QrCode, 
    Tag,
    ChevronLeft,
    ChevronRight,
    Camera,
    Info,
    AlertCircle,
    CheckCircle2,
    Users,
    RefreshCw,
    ShieldCheck,
    Wifi,
    WifiOff,
    Activity,
    Pause,
    Play,
    Filter,
    Search
} from 'lucide-react';
import Swal from 'sweetalert2';
import QRCode from 'qrcode';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { cn } from '@/lib/utils';
import { adminAttendance, adminAttendanceLogs, adminAttendanceStudentsByCourse, adminAttendanceDynamicQrToken, adminAttendanceActivateScannerPortal } from '@/routes';
import type { BreadcrumbItem } from '@/types';
import AdminLayout from '../admin-layout';

type ScanLog = {
    id: string;
    name: string;
    program: string;
    time: string;
};

type ProgramStat = {
    program: string;
    expected: number;
    scanned: number;
    percentage: number;
};

type LiveCounts = {
    total: number;
    present: number;
    late: number;
};

type Mode = 'scanner' | 'dynamic-qr' | 'command-center';

export default function AdminQrScannerPage({ event, logs, breakdown, tokenLifetimeSeconds = 30, events = [] }: any) {
    // QR Scanner state
    const videoRef = useRef<HTMLVideoElement>(null);
    const codeReaderRef = useRef<BrowserQRCodeReader | null>(null);
    const lastValueRef = useRef<{ value: string; at: number } | null>(null);
    const [scanState, setScanState] = useState<{ status: 'idle' | 'starting' | 'running' | 'error'; message?: string }>({
        status: 'idle',
    });
    const [lastScanned, setLastScanned] = useState<{ status: 'valid' | 'invalid'; message: string } | null>(null);
    const [counts, setCounts] = useState({
        total: logs?.length || 0,
        valid: logs?.length || 0,
        invalid: 0,
    });
    const [logRows, setLogRows] = useState<ScanLog[]>(logs || []);
    const [byCourse, setByCourse] = useState<ProgramStat[]>(breakdown || []);
    
    // Dynamic QR mode state
    const qrCanvasRef = useRef<HTMLCanvasElement | null>(null);
    const qrIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
    const qrCountdownRef = useRef<ReturnType<typeof setInterval> | null>(null);
    const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);
    const [token, setToken] = useState<string>('');
    const [expiresAt, setExpiresAt] = useState<Date | null>(null);
    const [remaining, setRemaining] = useState<number>(tokenLifetimeSeconds);
    const [qrLoading, setQrLoading] = useState<boolean>(true);
    const [qrError, setQrError] = useState<string | null>(null);
    const [portalActive, setPortalActive] = useState<boolean>(event?.scannerPortalActive || false);
    const [liveCounts, setLiveCounts] = useState<LiveCounts>({ total: 0, present: 0, late: 0 });
    const [lastRefresh, setLastRefresh] = useState<Date>(new Date());
    
    // Command Center state
    const [monitoringEnabled, setMonitoringEnabled] = useState(false);
    const [selectedEventId, setSelectedEventId] = useState<string>(event?.id ? String(event.id) : '');
    const [lastUpdatedAt, setLastUpdatedAt] = useState<string | null>(null);
    const [liveStartIndex, setLiveStartIndex] = useState(1);
    const [liveEndIndex, setLiveEndIndex] = useState(0);
    
    // Mode toggle state
    const [mode, setMode] = useState<Mode>('dynamic-qr');

    // Filter and Sort States
    const [sortBy, setSortBy] = useState('time');
    const [filterProgram, setFilterProgram] = useState('all');
    const [pageSize, setPageSize] = useState(10);
    const [currentPage, setCurrentPage] = useState(1);

    // Modal State
    const [showCourseStudentsModal, setShowCourseStudentsModal] = useState(false);
    const [selectedCourse, setSelectedCourse] = useState('');
    const [courseStudentsRows, setCourseStudentsRows] = useState<any[]>([]);
    const [courseStudentsLoading, setCourseStudentsLoading] = useState(false);
    const [courseStudentsError, setCourseStudentsError] = useState<string | null>(null);
    const [courseStudentsYearFilter, setCourseStudentsYearFilter] = useState('all');

    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Attendance', href: adminAttendance() },
        { title: 'Scanner', href: '#' },
    ];

    const formatTime12h = (timeStr?: string) => {
        if (!timeStr) return '—';
        try {
            const [hours, minutes] = timeStr.split(':');
            const h = parseInt(hours);
            const ampm = h >= 12 ? 'PM' : 'AM';
            const displayH = h % 12 || 12;
            return `${displayH}:${minutes} ${ampm}`;
        } catch {
            return timeStr;
        }
    };

    const scanBlocked = useMemo(() => {
        if (!event?.timeEnd) return false;
        const now = new Date();
        const [h, m] = event.timeEnd.split(':');
        const endTime = new Date();
        endTime.setHours(parseInt(h), parseInt(m), 0, 0);
        const blockTime = new Date(endTime.getTime() + 30 * 60000);
        return now > blockTime;
    }, [event]);

    const start = async () => {
        if (!videoRef.current || !event) return;
        setScanState({ status: 'starting' });
        try {
            if (!codeReaderRef.current) {
                codeReaderRef.current = new BrowserQRCodeReader();
            }
            await codeReaderRef.current.decodeFromVideoElement(videoRef.current, (result, error) => {
                if (result) {
                    processScan(result.getText());
                }
            });
            setScanState({ status: 'running' });
        } catch (err: any) {
            console.error(err);
            setScanState({ status: 'error', message: err.message || 'Failed to start camera' });
        }
    };

    const stop = () => {
        if (codeReaderRef.current) {
            // Re-initialize to stop scanning
            codeReaderRef.current = null;
            setScanState({ status: 'idle' });
        }
    };

    const processScan = async (code: string) => {
        // Debounce: ignore the same code within 2 seconds
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
            const res = await fetch(adminAttendanceLogs(event.id), {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Accept: 'application/json',
                    'X-Requested-With': 'XMLHttpRequest',
                    'X-CSRF-TOKEN': csrfToken,
                    'X-XSRF-TOKEN': csrfToken,
                },
                body: JSON.stringify({ student_qr: code }),
            });
            const data = await res.json();
            if (res.ok) {
                setLastScanned({ status: 'valid', message: data.message || 'Attendance recorded' });
                setCounts((prev) => ({ ...prev, total: prev.total + 1, valid: prev.valid + 1 }));
                if (data.log) {
                    setLogRows((prev) => [data.log, ...prev]);
                }
                if (data.breakdown) {
                    setByCourse(data.breakdown);
                }
            } else {
                setLastScanned({ status: 'invalid', message: data.message || 'Invalid QR code' });
                setCounts((prev) => ({ ...prev, total: prev.total + 1, invalid: prev.invalid + 1 }));
                
                Swal.fire({
                    icon: 'error',
                    title: 'Scan Failed',
                    text: data.message || 'Invalid QR code',
                    confirmButtonColor: '#0b2d66',
                });
            }
            // Clear feedback after 3 seconds
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

    const handleViewStudentsByCourse = async (program: string) => {
        setSelectedCourse(program);
        setCourseStudentsLoading(true);
        setCourseStudentsError(null);
        setShowCourseStudentsModal(true);
        try {
            const res = await fetch(adminAttendanceStudentsByCourse(selectedEventId || event.id, program), {
                headers: { Accept: 'application/json' },
            });
            if (res.ok) {
                const data = await res.json();
                setCourseStudentsRows(data.rows || []);
            } else {
                throw new Error('Failed to fetch students');
            }
        } catch (err: any) {
            setCourseStudentsError(err.message || 'Failed to load student list');
        } finally {
            setCourseStudentsLoading(false);
        }
    };

    // ─── Dynamic QR functions ───────────────────────────────────────────────────
    const renderQr = useCallback(async (payload: string) => {
        const canvas = qrCanvasRef.current;
        if (!canvas) return;
        await QRCode.toCanvas(canvas, payload, {
            width: 380,
            margin: 2,
            color: { dark: '#0f172a', light: '#ffffff' },
            errorCorrectionLevel: 'M',
        });
        setQrDataUrl(canvas.toDataURL());
    }, []);

    const fetchToken = useCallback(async () => {
        if (!selectedEventId && !event) return;
        setQrLoading(true);
        setQrError(null);
        try {
            const res = await fetch(adminAttendanceDynamicQrToken(selectedEventId || event.id), {
                headers: { 'X-Requested-With': 'XMLHttpRequest', Accept: 'application/json' },
                credentials: 'include',
            });
            if (!res.ok) {
                const body = await res.json().catch(() => ({}));
                if (res.status === 409) {
                    setPortalActive(false);
                    setQrError('Activate the attendance session first (click "Activate Scanner Portal" on the event).');
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

            // Parse token for display
            try {
                const parsed = JSON.parse(data.payload);
                setToken(String(parsed?.token ?? '').slice(0, 12) + '…');
            } catch {
                setToken('');
            }

            await renderQr(data.payload);
            setPortalActive(true);
        } catch (e: any) {
            setQrError(e?.message ?? 'Network error.');
        } finally {
            setQrLoading(false);
        }
    }, [selectedEventId, event, renderQr]);

    const fetchLiveCounts = useCallback(async () => {
        if (!selectedEventId && !event) return;
        try {
            const res = await fetch(adminAttendanceLogs(selectedEventId || event.id, 1), {
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
    }, [selectedEventId, event]);

    const refreshLogs = useCallback(async () => {
        if (!selectedEventId && !event) return;
        try {
            const res = await fetch(adminAttendanceLogs(selectedEventId || event.id), {
                headers: { Accept: 'application/json', 'X-Requested-With': 'XMLHttpRequest' },
            });
            if (!res.ok) return;
            const data = await res.json();
            const rows: any[] = (data.rows ?? []).map((r: any, idx: number) => ({
                id: String(r.id ?? idx),
                student_id: String(r.student_id ?? ''),
                name: String(r.name ?? ''),
                program: String(r.program ?? ''),
                time: String(r.time ?? ''),
                status: String(r.status ?? '').toLowerCase(),
            }));
            setLogRows(rows);
            const totalScans = Number(data.counts?.total ?? rows.length);
            const presentN = Number(data.counts?.present ?? 0);
            const lateN = Number(data.counts?.late ?? 0);
            setCounts({
                total: totalScans,
                valid: presentN + lateN,
                invalid: 0,
            });
            setLiveCounts({
                total: totalScans,
                present: presentN,
                late: lateN,
            });
            if (Array.isArray(data.breakdown) && data.breakdown.length > 0) {
                setByCourse(data.breakdown);
            }
            setLastUpdatedAt(data.server_time ?? new Date().toLocaleString());
        } catch {
            // polling: ignore transient errors
        }
    }, [selectedEventId, event]);

    const handleActivatePortalAndStartMonitoring = () => {
        if (!selectedEventId && !event) {
            Swal.fire({ icon: 'error', title: 'Select event', text: 'Choose an active event to monitor.' });
            return;
        }
        if (selectedEventId) {
            router.post(adminAttendanceActivateScannerPortal(selectedEventId), {}, { preserveScroll: true });
        }
        setPortalActive(true);
        setMonitoringEnabled(true);
        setLastUpdatedAt(new Date().toLocaleString());
        void refreshLogs();
    };

    // Filter and Sort Logic
    const filteredAndSortedLogRows = useMemo(() => {
        let result = [...logRows];
        if (filterProgram !== 'all') {
            result = result.filter((r) => r.program === filterProgram);
        }
        result.sort((a, b) => {
            if (sortBy === 'time') return b.time.localeCompare(a.time);
            if (sortBy === 'name') return a.name.localeCompare(b.name);
            return a.id.localeCompare(b.id);
        });
        return result;
    }, [logRows, sortBy, filterProgram]);

    const totalPages = Math.ceil(filteredAndSortedLogRows.length / pageSize);
    const startIndex = (currentPage - 1) * pageSize;
    const endIndex = Math.min(startIndex + pageSize, filteredAndSortedLogRows.length);
    const paginatedLogRows = filteredAndSortedLogRows.slice(startIndex, endIndex);

    // ─── Dynamic QR effects ─────────────────────────────────────────────────────
    useEffect(() => {
        // Countdown timer for token expiration
        qrCountdownRef.current = setInterval(() => {
            if (!expiresAt) return;
            const diff = Math.max(0, Math.ceil((expiresAt.getTime() - Date.now()) / 1000));
            setRemaining(diff);
        }, 250);

        return () => {
            if (qrCountdownRef.current) clearInterval(qrCountdownRef.current);
        };
    }, [expiresAt]);

    useEffect(() => {
        if (mode === 'dynamic-qr') {
            void fetchToken();
            void fetchLiveCounts();

            qrIntervalRef.current = setInterval(() => {
                void fetchToken();
            }, tokenLifetimeSeconds * 1000);

            const countsInterval = setInterval(fetchLiveCounts, 10000);

            return () => {
                if (qrIntervalRef.current) clearInterval(qrIntervalRef.current);
                clearInterval(countsInterval);
            };
        }
    }, [mode, fetchToken, fetchLiveCounts, tokenLifetimeSeconds]);

    // Command Center polling
    useEffect(() => {
        if (mode !== 'command-center' || !monitoringEnabled) return undefined;
        const id = window.setInterval(() => void refreshLogs(), 2500);
        return () => window.clearInterval(id);
    }, [mode, monitoringEnabled, refreshLogs]);

    // QR Scanner cleanup
    useEffect(() => {
        return () => stop();
    }, []);

    return (
        <AdminLayout breadcrumbs={breadcrumbs}>
            <Head title="Attendance Scanner" />

            <div className="min-h-[calc(100vh-4rem)] bg-slate-50/50 dark:bg-slate-900">
                <div className="flex w-full flex-col gap-6 px-6 py-8">
                    {/* Page Header */}
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-slate-200 dark:border-slate-800 pb-6">
                        <div className="flex items-center gap-4">
                            <Button
                                type="button"
                                variant="ghost"
                                className="h-12 w-12 rounded-2xl bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400 p-0 hover:bg-slate-200 transition-all duration-300 mr-2"
                                asChild
                            >
                                <Link href={adminAttendance()}>
                                    <ArrowLeft className="h-6 w-6" />
                                </Link>
                            </Button>
                            <div className="grid h-12 w-12 place-items-center rounded-2xl bg-blue-600/10 text-blue-600 dark:bg-blue-600/20 dark:text-blue-400">
                                <Calendar className="h-6 w-6" />
                            </div>
                            <div>
                                <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
                                    {mode === 'scanner' ? "QR Scanner" : mode === 'dynamic-qr' ? "Dynamic QR" : "Command Center"}
                                </h1>
                                <p className="text-sm text-slate-500 dark:text-slate-400">
                                    {mode === 'scanner' 
                                        ? "Scan student QR codes to record attendance" 
                                        : mode === 'dynamic-qr'
                                        ? "Show dynamic QR for students to scan"
                                        : "Monitor attendance in real time"
                                    }
                                </p>
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            {/* Mode Switcher */}
                            <div className="inline-flex rounded-xl bg-slate-100 dark:bg-slate-800 p-1 gap-1">
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => setMode('scanner')}
                                    className={cn(
                                        "h-10 px-4 text-xs font-bold uppercase tracking-widest rounded-lg transition-all duration-300",
                                        mode === 'scanner' 
                                            ? "bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-sm" 
                                            : "text-slate-500 hover:text-slate-700"
                                    )}
                                >
                                    <Camera className="h-4 w-4 mr-1" />
                                    Scanner
                                </Button>
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => setMode('dynamic-qr')}
                                    className={cn(
                                        "h-10 px-4 text-xs font-bold uppercase tracking-widest rounded-lg transition-all duration-300",
                                        mode === 'dynamic-qr' 
                                            ? "bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-sm" 
                                            : "text-slate-500 hover:text-slate-700"
                                    )}
                                >
                                    <QrCode className="h-4 w-4 mr-1" />
                                    Dynamic QR
                                </Button>
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => setMode('command-center')}
                                    className={cn(
                                        "h-10 px-4 text-xs font-bold uppercase tracking-widest rounded-lg transition-all duration-300",
                                        mode === 'command-center' 
                                            ? "bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-sm" 
                                            : "text-slate-500 hover:text-slate-700"
                                    )}
                                >
                                    <Activity className="h-4 w-4 mr-1" />
                                    Command Center
                                </Button>
                            </div>
                        </div>
                    </div>

                    {/* Mode-specific content */}
                    {mode === 'scanner' ? (
                        <div className="space-y-6">
                            {/* Notification Banners */}
                            <div className="space-y-3">
                                {event?.scannerPortalActive === false && (
                                    <div className="flex items-center gap-3 rounded-2xl border border-amber-200 bg-amber-50/50 p-4 text-sm font-bold text-amber-900 backdrop-blur-md dark:border-amber-500/20 dark:bg-amber-500/10 dark:text-amber-200">
                                        <AlertCircle className="h-5 w-5 shrink-0" />
                                        Scanner portal is not activated yet. Please activate it in Command Center.
                                    </div>
                                )}

                                {event && event.scannerPortalActive !== false && scanBlocked && (
                                    <div className="flex items-center gap-3 rounded-2xl border border-rose-200 bg-rose-50/50 p-4 text-sm font-bold text-rose-900 backdrop-blur-md dark:border-rose-500/20 dark:bg-rose-500/10 dark:text-rose-200">
                                        <AlertCircle className="h-5 w-5 shrink-0" />
                                        Scanning is disabled 30 minutes after the registration end time.
                                    </div>
                                )}
                            </div>

                            <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
                                {/* Main Scanner Area */}
                                <div className="lg:col-span-2 space-y-6">
                                    {/* Scanner Viewport */}
                                    <Card className="overflow-hidden border-0 bg-white dark:bg-[#0B192C]/50 shadow-2xl shadow-blue-500/5 rounded-[2rem]">
                                        <CardHeader className="border-b border-slate-50 dark:border-slate-800/50 bg-slate-50/30 dark:bg-slate-900/30 px-8 py-6">
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-3">
                                                    <div className="p-2.5 rounded-xl bg-blue-600/10 dark:bg-blue-600/20">
                                                        <Camera className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                                                    </div>
                                                    <CardTitle className="text-lg font-black tracking-tight text-slate-900 dark:text-white uppercase">Live Camera</CardTitle>
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
                                                            onClick={start}
                                                            disabled={!event || event.scannerPortalActive === false || scanBlocked || scanState.status === 'starting' || scanState.status === 'running'}
                                                        >
                                                            <QrCode className="h-4 w-4" />
                                                            Start Scanner
                                                        </Button>
                                                        <Button
                                                            type="button"
                                                            variant="outline"
                                                            className="h-10 rounded-xl border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-5 text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700 transition-all duration-300"
                                                            onClick={stop}
                                                            disabled={!event || event.scannerPortalActive === false}
                                                        >
                                                            Stop
                                                        </Button>
                                                    </div>
                                                </div>
                                            </div>
                                        </CardHeader>
                                        <CardContent className="p-0">
                                            <div className="relative aspect-video w-full bg-slate-900 overflow-hidden">
                                                <video
                                                    ref={videoRef}
                                                    className="absolute inset-0 h-full w-full object-cover opacity-80"
                                                    playsInline
                                                    muted
                                                />
                                                
                                                {/* Scanning Overlay Animation */}
                                                <div className="absolute inset-0 pointer-events-none">
                                                    <div className="absolute inset-0 border-[40px] border-black/40" />
                                                    <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 border-2 border-white/50 rounded-2xl shadow-[0_0_0_1000px_rgba(0,0,0,0.3)]">
                                                        <div className="absolute inset-0 border-2 border-blue-500 rounded-2xl animate-pulse" />
                                                        {/* Corner Accents */}
                                                        <div className="absolute -left-1 -top-1 w-8 h-8 border-t-4 border-l-4 border-blue-500 rounded-tl-lg" />
                                                        <div className="absolute -right-1 -top-1 w-8 h-8 border-t-4 border-r-4 border-blue-500 rounded-tr-lg" />
                                                        <div className="absolute -left-1 -bottom-1 w-8 h-8 border-b-4 border-l-4 border-blue-500 rounded-bl-lg" />
                                                        <div className="absolute -right-1 -bottom-1 w-8 h-8 border-b-4 border-r-4 border-blue-500 rounded-br-lg" />
                                                        
                                                        {/* Scanning Line */}
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

                                                {/* Result Feedback Overlay */}
                                                <div className="absolute inset-x-0 bottom-0 p-6 bg-gradient-to-t from-black/80 to-transparent">
                                                    {lastScanned ? (
                                                        <div className={cn(
                                                            "flex items-center justify-center gap-3 rounded-2xl px-6 py-4 backdrop-blur-xl border transition-all duration-500 animate-in fade-in slide-in-from-bottom-4",
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
                                            </div>
                                        </CardContent>
                                    </Card>

                                    {/* Recent Scans Table */}
                                    <Card className="overflow-hidden border-0 bg-white dark:bg-[#0B192C]/50 shadow-2xl shadow-blue-500/5 rounded-[2rem]">
                                        <CardHeader className="border-b border-slate-50 dark:border-slate-800/50 px-8 py-6">
                                            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                                                <div className="flex items-center gap-3">
                                                    <div className="p-2.5 rounded-xl bg-blue-600/10 dark:bg-blue-600/20">
                                                        <Clock className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                                                    </div>
                                                    <CardTitle className="text-lg font-black tracking-tight text-slate-900 dark:text-white uppercase">Recent Scans</CardTitle>
                                                </div>
                                                <div className="flex flex-wrap items-center gap-2">
                                                    <select 
                                                        value={sortBy}
                                                        onChange={(e) => setSortBy(e.target.value)}
                                                        className="h-10 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-4 text-xs font-bold text-slate-700 dark:text-slate-300 focus:ring-2 focus:ring-blue-500/20"
                                                    >
                                                        <option value="time">Sort by Time</option>
                                                        <option value="name">Sort by Name</option>
                                                        <option value="id">Sort by ID</option>
                                                    </select>
                                                    <select 
                                                        value={filterProgram}
                                                        onChange={(e) => setFilterProgram(e.target.value)}
                                                        className="h-10 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-4 text-xs font-bold text-slate-700 dark:text-slate-300 focus:ring-2 focus:ring-blue-500/20"
                                                    >
                                                        <option value="all">All Programs</option>
                                                        <option value="BSIT">BSIT</option>
                                                        <option value="BSHM">BSHM</option>
                                                        <option value="BSTM">BSTM</option>
                                                    </select>
                                                </div>
                                            </div>
                                        </CardHeader>
                                        <CardContent className="p-0">
                                            <div className="overflow-x-auto">
                                                <table className="w-full text-left">
                                                    <thead className="bg-slate-50/50 dark:bg-slate-900/50 border-b border-slate-100 dark:border-slate-800">
                                                        <tr>
                                                            <th className="px-8 py-4 text-[10px] font-black uppercase tracking-[0.15em] text-slate-500">Student ID</th>
                                                            <th className="px-8 py-4 text-[10px] font-black uppercase tracking-[0.15em] text-slate-500">Name</th>
                                                            <th className="px-8 py-4 text-[10px] font-black uppercase tracking-[0.15em] text-slate-500">Program</th>
                                                            <th className="px-8 py-4 text-[10px] font-black uppercase tracking-[0.15em] text-slate-500 text-right">Time</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody className="divide-y divide-slate-50 dark:divide-slate-800">
                                                        {paginatedLogRows.length ? (
                                                            paginatedLogRows.map((row) => (
                                                                <tr key={row.id} className="group hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-all duration-200">
                                                                    <td className="px-8 py-4 text-sm font-black text-slate-900 dark:text-white">{(row as any).student_id}</td>
                                                                    <td className="px-8 py-4 text-sm font-bold text-slate-600 dark:text-slate-400 group-hover:text-slate-900 dark:group-hover:text-white transition-colors">{row.name}</td>
                                                                    <td className="px-8 py-4">
                                                                        <Badge variant="outline" className="rounded-lg border-slate-200 dark:border-slate-700 font-bold text-[10px] uppercase tracking-wider text-slate-500">
                                                                            {row.program}
                                                                        </Badge>
                                                                    </td>
                                                                    <td className="px-8 py-4 text-right text-sm font-black text-blue-600 dark:text-blue-400">{row.time}</td>
                                                                </tr>
                                                            ))
                                                        ) : (
                                                            <tr>
                                                                <td colSpan={4} className="px-8 py-16 text-center">
                                                                    <div className="flex flex-col items-center gap-3 opacity-30">
                                                                        <QrCode className="h-12 w-12" />
                                                                        <p className="text-xs font-black uppercase tracking-widest">No scan history available</p>
                                                                    </div>
                                                                </td>
                                                            </tr>
                                                        )}
                                                    </tbody>
                                                </table>
                                            </div>

                                            {/* Pagination Controls */}
                                            <div className="border-t border-slate-50 dark:border-slate-800 px-8 py-6">
                                                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                                                    <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">
                                                        Showing {startIndex} to {endIndex} of {filteredAndSortedLogRows.length} scans
                                                    </p>
                                                    
                                                    <div className="flex items-center gap-4">
                                                        <div className="flex items-center gap-2 pr-4 border-r border-slate-200 dark:border-slate-800">
                                                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">View</span>
                                                            <select
                                                                value={pageSize}
                                                                onChange={(e) => {
                                                                    setPageSize(Number(e.target.value));
                                                                    setCurrentPage(1);
                                                                }}
                                                                className="h-8 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-2 text-[11px] font-bold text-slate-700 dark:text-slate-300"
                                                            >
                                                                <option value={5}>5</option>
                                                                <option value={10}>10</option>
                                                                <option value={15}>15</option>
                                                                <option value={20}>20</option>
                                                            </select>
                                                        </div>

                                                        <div className="flex items-center gap-2">
                                                            <Button
                                                                variant="outline"
                                                                size="icon"
                                                                className="h-8 w-8 rounded-lg border-slate-200 dark:border-slate-800"
                                                                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                                                                disabled={currentPage <= 1}
                                                            >
                                                                <ChevronLeft className="h-4 w-4" />
                                                            </Button>
                                                            <div className="flex items-center gap-1">
                                                                {Array.from({ length: Math.min(totalPages, 3) }).map((_, idx) => {
                                                                    const pageNum = idx + 1;
                                                                    return (
                                                                        <Button
                                                                            key={pageNum}
                                                                            size="icon"
                                                                            className={cn(
                                                                                "h-8 w-8 rounded-lg font-black text-xs transition-all duration-300",
                                                                                currentPage === pageNum 
                                                                                    ? "bg-blue-600 text-white shadow-lg shadow-blue-500/20" 
                                                                                    : "bg-transparent text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                                                                            )}
                                                                            onClick={() => setCurrentPage(pageNum)}
                                                                        >
                                                                            {pageNum}
                                                                        </Button>
                                                                    );
                                                                })}
                                                            </div>
                                                            <Button
                                                                variant="outline"
                                                                size="icon"
                                                                className="h-8 w-8 rounded-lg border-slate-200 dark:border-slate-800"
                                                                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                                                                disabled={currentPage >= totalPages}
                                                            >
                                                                <ChevronRight className="h-4 w-4" />
                                                            </Button>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </CardContent>
                                    </Card>
                                </div>

                                {/* Sidebar - Event Details & Stats */}
                                <div className="lg:col-span-1 space-y-8">
                                    {/* Event Info Card */}
                                    <Card className="overflow-hidden border-0 bg-white dark:bg-[#0B192C]/50 shadow-2xl shadow-blue-500/5 rounded-[2rem]">
                                        <CardHeader className="border-b border-slate-50 dark:border-slate-800/50 bg-slate-50/30 dark:bg-slate-900/30 px-6 py-6">
                                            <div className="flex items-center gap-3">
                                                <div className="p-2.5 rounded-xl bg-blue-600/10 dark:bg-blue-600/20 text-blue-600 dark:text-blue-400">
                                                    <Calendar className="h-5 w-5" />
                                                </div>
                                                <CardTitle className="text-lg font-black tracking-tight text-slate-900 dark:text-white uppercase">Event Hub</CardTitle>
                                            </div>
                                        </CardHeader>
                                        <CardContent className="px-6 py-8 space-y-6">
                                            {/* Main Label */}
                                            <div className="p-5 rounded-3xl bg-[#0b2d66] dark:bg-blue-900/20 text-white relative overflow-hidden group">
                                                <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform duration-500">
                                                    <Tag className="h-16 w-16" />
                                                </div>
                                                <div className="relative z-10">
                                                    <span className="text-[10px] font-black uppercase tracking-[0.2em] text-blue-200 opacity-70">Active Event</span>
                                                    <h3 className="mt-1 text-lg font-black leading-tight">{event?.name || '—'}</h3>
                                                </div>
                                            </div>

                                            {/* Location & Date Details */}
                                            <div className="space-y-3">
                                                <div className="flex items-center gap-4 p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700/50 group hover:border-blue-500/30 transition-all duration-300">
                                                    <div className="p-2.5 rounded-xl bg-white dark:bg-slate-700 shadow-sm text-slate-400 group-hover:text-blue-500 transition-colors">
                                                        <CalendarDays className="h-4 w-4" />
                                                    </div>
                                                    <div>
                                                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-0.5">Event Date</p>
                                                        <p className="text-sm font-black text-slate-900 dark:text-white">{event?.date || '—'}</p>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-4 p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700/50 group hover:border-blue-500/30 transition-all duration-300">
                                                    <div className="p-2.5 rounded-xl bg-white dark:bg-slate-700 shadow-sm text-slate-400 group-hover:text-blue-500 transition-colors">
                                                        <MapPin className="h-4 w-4" />
                                                    </div>
                                                    <div>
                                                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-0.5">Venue Location</p>
                                                        <p className="text-sm font-black text-slate-900 dark:text-white">{event?.location || '—'}</p>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Stats Grid */}
                                            <div className="grid grid-cols-1 gap-3">
                                                <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/30 flex items-center justify-between group">
                                                    <div className="flex items-center gap-3">
                                                        <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-600">
                                                            <CheckCircle2 className="h-4 w-4" />
                                                        </div>
                                                        <span className="text-xs font-bold text-emerald-800 dark:text-emerald-400 uppercase tracking-widest">Valid</span>
                                                    </div>
                                                    <span className="text-xl font-black text-emerald-900 dark:text-emerald-200 group-hover:scale-110 transition-transform">{counts.valid}</span>
                                                </div>
                                                <div className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/20 border border-rose-100 dark:border-rose-900/30 flex items-center justify-between group">
                                                    <div className="flex items-center gap-3">
                                                        <div className="p-2 rounded-lg bg-rose-500/10 text-rose-600">
                                                            <AlertCircle className="h-4 w-4" />
                                                        </div>
                                                        <span className="text-xs font-bold text-rose-800 dark:text-rose-400 uppercase tracking-widest">Invalid</span>
                                                    </div>
                                                    <span className="text-xl font-black text-rose-900 dark:text-rose-200 group-hover:scale-110 transition-transform">{counts.invalid}</span>
                                                </div>
                                                <div className="p-4 rounded-2xl bg-blue-50 dark:bg-blue-950/20 border border-blue-100 dark:border-blue-900/30 flex items-center justify-between group">
                                                    <div className="flex items-center gap-3">
                                                        <div className="p-2 rounded-lg bg-blue-500/10 text-blue-600">
                                                            <BarChart3 className="h-4 w-4" />
                                                        </div>
                                                        <span className="text-xs font-bold text-blue-800 dark:text-blue-400 uppercase tracking-widest">Total</span>
                                                    </div>
                                                    <span className="text-xl font-black text-blue-900 dark:text-blue-200 group-hover:scale-110 transition-transform">{counts.total}</span>
                                                </div>
                                            </div>
                                        </CardContent>
                                    </Card>
                                </div>
                            </div>
                        </div>
                    ) : mode === 'dynamic-qr' ? (
                        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3 mx-auto max-w-5xl w-full">
                            {/* ─── QR Code Panel ─────────────────────────────────────────────────── */}
                            <div className="lg:col-span-2">
                                <div className="overflow-hidden rounded-3xl bg-white dark:bg-[#0B192C]/80 border border-slate-200 dark:border-slate-800 shadow-xl">
                                    {/* Title bar */}
                                    <div className="border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 px-8 py-6">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-3">
                                                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600/10 dark:bg-blue-600/20">
                                                    <QrCode className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                                                </div>
                                                <div>
                                                    <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                                                        {event?.name || 'Select an event'}
                                                    </h3>
                                                    <p className="text-xs text-slate-500 dark:text-slate-400">
                                                        {event?.location || 'No location set'}
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-3">
                                                {portalActive ? (
                                                    <span className="inline-flex items-center gap-2 rounded-full bg-emerald-500/10 px-4 py-2 text-xs font-semibold text-emerald-700 dark:text-emerald-300 ring-1 ring-emerald-500/30">
                                                        <Wifi className="h-4 w-4" />
                                                        Session Active
                                                    </span>
                                                ) : (
                                                    <span className="inline-flex items-center gap-2 rounded-full bg-rose-500/10 px-4 py-2 text-xs font-semibold text-rose-700 dark:text-rose-300 ring-1 ring-rose-500/30">
                                                        <WifiOff className="h-4 w-4" />
                                                        Session Inactive
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    {/* QR display area */}
                                    <div className="flex flex-col items-center gap-6 px-8 py-10">
                                        {qrError ? (
                                            <div className="flex flex-col items-center gap-4 text-center">
                                                <div className="flex h-24 w-24 items-center justify-center rounded-2xl bg-rose-50 dark:bg-rose-500/10 ring-1 ring-rose-200 dark:ring-rose-500/30">
                                                    <WifiOff className="h-12 w-12 text-rose-600 dark:text-rose-400" />
                                                </div>
                                                <p className="max-w-sm text-sm text-rose-700 dark:text-rose-300">{qrError}</p>
                                                <Button
                                                    type="button"
                                                    variant="outline"
                                                    onClick={() => void fetchToken()}
                                                    className="inline-flex items-center gap-2 rounded-xl bg-slate-100 dark:bg-white/10 px-4 py-2 text-sm font-medium text-slate-900 dark:text-white transition hover:bg-slate-200 dark:hover:bg-white/20"
                                                >
                                                    <RefreshCw className="h-4 w-4" />
                                                    Retry
                                                </Button>
                                            </div>
                                        ) : (
                                            <>
                                                {/* QR code with countdown ring */}
                                                <div className="relative">
                                                    {/* Outer countdown ring */}
                                                    <svg
                                                        className="absolute -inset-4 -rotate-90"
                                                        width="calc(100% + 2rem)"
                                                        height="calc(100% + 2rem)"
                                                        viewBox="0 0 440 440"
                                                        style={{ width: 440, height: 440, top: -16, left: -16, position: 'absolute' }}
                                                    >
                                                        <circle
                                                            cx="220" cy="220" r="210"
                                                            fill="none"
                                                            stroke="rgba(148,163,184,0.2)"
                                                            strokeWidth="6"
                                                        />
                                                        <circle
                                                            cx="220" cy="220" r="210"
                                                            fill="none"
                                                            stroke={(remaining <= 5) ? '#f87171' : '#6366f1'}
                                                            strokeWidth="6"
                                                            strokeLinecap="round"
                                                            strokeDasharray={`${2 * Math.PI * 210 * (remaining / tokenLifetimeSeconds)} ${2 * Math.PI * 210}`}
                                                            className="transition-all duration-300"
                                                        />
                                                    </svg>

                                                    {/* QR canvas */}
                                                    <div className={`overflow-hidden rounded-2xl bg-white p-4 shadow-xl transition-opacity duration-300 ${qrLoading ? 'opacity-40' : 'opacity-100'}`}>
                                                        <canvas ref={qrCanvasRef} width={380} height={380} />
                                                    </div>

                                                    {qrLoading && (
                                                        <div className="absolute inset-0 flex items-center justify-center">
                                                            <RefreshCw className="h-12 w-12 animate-spin text-slate-400" />
                                                        </div>
                                                    )}
                                                </div>

                                                {/* Countdown label */}
                                                <div className={`flex items-center gap-2 text-sm font-bold transition-colors ${remaining <= 5 ? 'text-red-500' : 'text-slate-500'}`}>
                                                    <Clock className="h-4 w-4" />
                                                    {remaining > 0
                                                        ? `Refreshing in ${remaining}s`
                                                        : <span className="animate-pulse">Refreshing…</span>
                                                    }
                                                </div>

                                                {/* Token preview */}
                                                {token && (
                                                    <div className="flex items-center gap-2 rounded-xl bg-slate-50 dark:bg-white/5 px-4 py-2 font-mono text-xs text-slate-600 dark:text-white/40 ring-1 ring-slate-200 dark:ring-white/10">
                                                        <ShieldCheck className="h-3.5 w-3.5 text-blue-600 dark:text-indigo-400" />
                                                        Token: {token}
                                                    </div>
                                                )}

                                                <p className="max-w-sm text-center text-xs text-slate-500 dark:text-white/40">
                                                    Show this QR code on your screen or projector. Students scan it using their DSAMS app to check in. It auto-rotates every {tokenLifetimeSeconds} seconds.
                                                </p>
                                            </>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* ─── Stats & Info Panel ───────────────────────────────────────────────────── */}
                            <div className="flex flex-col gap-4">
                                {/* Live counts */}
                                <div className="rounded-2xl bg-white dark:bg-[#0B192C]/80 border border-slate-200 dark:border-slate-800 shadow-xl p-5">
                                    <div className="mb-4 flex items-center gap-2 text-sm font-bold text-slate-900 dark:text-white/70">
                                        <Users className="h-4 w-4" />
                                        Live Attendance
                                    </div>
                                    <div className="grid grid-cols-1 gap-3">
                                        <div className="flex items-center justify-between rounded-xl bg-slate-50 dark:bg-white/5 px-4 py-3">
                                            <span className="text-xs font-bold text-slate-500 dark:text-white/50">Total Checked In</span>
                                            <span className="text-2xl font-black text-slate-900 dark:text-white">{liveCounts.total}</span>
                                        </div>
                                        <div className="flex items-center justify-between rounded-xl bg-emerald-50 dark:bg-emerald-500/10 px-4 py-3">
                                            <span className="text-xs font-bold text-emerald-700 dark:text-emerald-300">Present</span>
                                            <span className="text-2xl font-black text-emerald-700 dark:text-emerald-300">{liveCounts.present}</span>
                                        </div>
                                        <div className="flex items-center justify-between rounded-xl bg-amber-50 dark:bg-amber-500/10 px-4 py-3">
                                            <span className="text-xs font-bold text-amber-700 dark:text-amber-300">Late</span>
                                            <span className="text-2xl font-black text-amber-700 dark:text-amber-300">{liveCounts.late}</span>
                                        </div>
                                    </div>
                                    <p className="mt-3 text-right text-xs text-slate-400 dark:text-white/30">
                                        Updated every 10s
                                    </p>
                                </div>

                                {/* Security info */}
                                <div className="rounded-2xl bg-white dark:bg-[#0B192C]/80 border border-slate-200 dark:border-slate-800 shadow-xl p-5">
                                    <div className="mb-3 flex items-center gap-2 text-sm font-bold text-slate-900 dark:text-white/70">
                                        <ShieldCheck className="h-4 w-4" />
                                        Security Checks
                                    </div>
                                    <ul className="space-y-2">
                                        {[
                                            'Student must be logged in',
                                            'Token valid for 30 seconds only',
                                            'Token is single-use (invalidated on scan)',
                                            'GPS geofence verified (if enabled)',
                                            'Duplicate check-in prevented',
                                        ].map((item) => (
                                            <li key={item} className="flex items-center gap-2 text-xs text-slate-500 dark:text-white/50">
                                                <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-emerald-500 dark:text-emerald-400" />
                                                {item}
                                            </li>
                                        ))}
                                    </ul>
                                </div>

                                {/* How students scan */}
                                <div className="rounded-2xl bg-blue-50 dark:bg-indigo-500/10 border border-blue-100 dark:border-indigo-500/20 p-5">
                                    <div className="mb-3 text-sm font-bold text-blue-700 dark:text-indigo-300">How Students Scan</div>
                                    <ol className="space-y-2 text-xs text-blue-600/70 dark:text-indigo-200/70">
                                        <li>1. Open DSAMS on their device</li>
                                        <li>2. Go to their Dashboard</li>
                                        <li>3. Tap <strong className="text-blue-800 dark:text-indigo-200">Scan Attendance QR</strong> for this event</li>
                                        <li>4. Point camera at this QR code</li>
                                        <li>5. Attendance is instantly recorded ✓</li>
                                    </ol>
                                </div>

                                {/* Last refreshed */}
                                <div className="rounded-2xl bg-white dark:bg-[#0B192C]/80 border border-slate-200 dark:border-slate-800 shadow-xl px-4 py-3 text-xs text-slate-400 dark:text-white/30">
                                    Last token generated: {lastRefresh.toLocaleTimeString()}
                                </div>
                            </div>
                        </div>
                    ) : (
                        /* Command Center Mode */
                        <div className="space-y-6 animate-in fade-in duration-500">
                            {/* ─── MODERN MONITORING HEADER ───────────────────────────────────────────── */}
                            <div className="overflow-hidden rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0B192C]/50 shadow-sm">
                                <div className="border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/30 px-6 py-4">
                                    <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                                        <div className="flex items-center gap-3">
                                            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600/10 dark:bg-blue-600/20">
                                                <Activity className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                                            </div>
                                            <div>
                                                <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                                                    Real-Time Command Center
                                                </h3>
                                                <div className="mt-1 flex items-center gap-3 text-xs text-slate-500 dark:text-slate-400">
                                                    <span className="flex items-center gap-1.5">
                                                        <Activity className={`h-3 w-3 ${monitoringEnabled ? 'text-emerald-500 animate-pulse' : 'text-slate-400'}`} />
                                                        {monitoringEnabled ? 'System Live' : 'System Paused'}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="flex flex-wrap items-center gap-3">
                                            <div className="hidden sm:flex items-center gap-2 rounded-lg bg-slate-100 dark:bg-slate-800 px-3 py-1.5 border border-slate-200 dark:border-slate-700">
                                                <Clock className="h-3.5 w-3.5 text-slate-400" />
                                                <span className="text-xs font-bold text-slate-600 dark:text-slate-300">Last Sync: {lastUpdatedAt ? lastUpdatedAt.split(',')[1]?.trim() || lastUpdatedAt : 'Never'}</span>
                                            </div>

                                            <Button
                                                type="button"
                                                variant={monitoringEnabled ? 'outline' : 'default'}
                                                className={`h-10 gap-2 rounded-xl px-5 font-bold transition-all duration-300 ${
                                                    monitoringEnabled
                                                        ? 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700'
                                                        : 'bg-blue-600 text-white hover:bg-blue-700 shadow-lg shadow-blue-500/20'
                                                }`}
                                                onClick={() => {
                                                    if (monitoringEnabled) {
                                                        setMonitoringEnabled(false);
                                                        return;
                                                    }
                                                    handleActivatePortalAndStartMonitoring();
                                                }}
                                            >
                                                {monitoringEnabled ? (
                                                    <>
                                                        <Pause className="h-4 w-4 fill-current" />
                                                        Pause Monitoring
                                                    </>
                                                ) : (
                                                    <>
                                                        <Play className="h-4 w-4 fill-current" />
                                                        Start Live Monitoring
                                                    </>
                                                )}
                                            </Button>
                                        </div>
                                    </div>

                                    <div className="mt-4">
                                        <div className="relative">
                                            <Filter className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                                            <select
                                                value={selectedEventId || (event?.id ? String(event.id) : '')}
                                                onChange={(e) => {
                                                    setSelectedEventId(e.target.value);
                                                    void refreshLogs();
                                                }}
                                                className="h-10 w-full rounded-xl border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 pl-10 pr-4 text-sm font-bold text-slate-700 dark:text-slate-200 shadow-sm transition-all focus:border-blue-500 focus:ring-4 focus:ring-blue-500/20"
                                            >
                                                <option value="" disabled>Select event to monitor...</option>
                                                {(events?.length > 0 ? events : [event]).filter(Boolean).map((ev: any) => (
                                                    <option key={ev.id} value={String(ev.id)}>{ev.name}</option>
                                                ))}
                                            </select>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* ─── DASHBOARD GRID LAYOUT ────────────────────────────────────────────────── */}
                            <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
                                
                                {/* LEFT COLUMN: LIVE FEED (8/12) */}
                                <div className="lg:col-span-8 flex flex-col gap-6">
                                    <Card className="overflow-hidden border-slate-200 dark:border-slate-800 shadow-sm">
                                        <CardHeader className="border-b border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900/30 px-6 py-4">
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-3">
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
                                                        {paginatedLogRows.length ? (
                                                            paginatedLogRows.map((row, index) => (
                                                                <tr 
                                                                    key={(row as any).id} 
                                                                    className={`group transition-all duration-300 hover:bg-slate-50 dark:hover:bg-slate-800/50 ${
                                                                        index === 0 && monitoringEnabled ? 'bg-blue-50/30 dark:bg-blue-900/10 animate-pulse' : ''
                                                                    }`}
                                                                >
                                                                    <td className="px-6 py-4">
                                                                        <div className="flex items-center gap-3">
                                                                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800 text-xs font-bold text-slate-600 dark:text-slate-400 group-hover:bg-blue-100 dark:group-hover:bg-blue-900/30 group-hover:text-blue-600 transition-colors">
                                                                                {row.name?.split(' ').map((n: string) => n[0]).join('').substring(0, 2).toUpperCase() || '??'}
                                                                            </div>
                                                                            <div>
                                                                                <div className="text-sm font-bold text-slate-900 dark:text-white">{row.name || 'Unknown Student'}</div>
                                                                                <div className="text-[11px] font-bold text-slate-500">{(row as any).student_id || '—'}</div>
                                                                            </div>
                                                                        </div>
                                                                    </td>
                                                                    <td className="px-6 py-4">
                                                                        <div className="text-sm font-bold text-slate-700 dark:text-slate-300">{row.program || '—'}</div>
                                                                    </td>
                                                                    <td className="px-6 py-4">
                                                                        <div className={cn(
                                                                            "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-bold border",
                                                                            (row as any).status?.toLowerCase() === 'late'
                                                                                ? 'bg-amber-50 text-amber-700 border-amber-100 dark:bg-amber-500/10 dark:text-amber-300 dark:border-amber-500/30'
                                                                                : (row as any).status?.toLowerCase() === 'present'
                                                                                ? 'bg-emerald-50 text-emerald-700 border-emerald-100 dark:bg-emerald-500/10 dark:text-emerald-300 dark:border-emerald-500/30'
                                                                                : 'bg-slate-50 text-slate-700 border-slate-100 dark:bg-slate-800/50 dark:text-slate-400 dark:border-slate-700/50'
                                                                        )}>
                                                                            <span className={cn(
                                                                                "h-1.5 w-1.5 rounded-full",
                                                                                (row as any).status?.toLowerCase() === 'late' ? 'bg-amber-500' :
                                                                                (row as any).status?.toLowerCase() === 'present' ? 'bg-emerald-500' : 'bg-slate-400'
                                                                            )} />
                                                                            {(row as any).status ? (row as any).status.charAt(0).toUpperCase() + (row as any).status.slice(1) : '—'}
                                                                        </div>
                                                                    </td>
                                                                    <td className="px-6 py-4 text-right">
                                                                        <div className="text-sm font-bold text-slate-900 dark:text-white">{row.time || '—'}</div>
                                                                        <div className="text-[10px] font-bold text-slate-400">Just now</div>
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

                                            {/* Pagination */}
                                            <div className="border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/30 px-6 py-3">
                                                <div className="flex items-center justify-between">
                                                    <span className="text-[11px] font-bold uppercase tracking-widest text-slate-500">
                                                        Showing {startIndex}-{endIndex} <span className="mx-1 text-slate-300">/</span> {logRows.length} Total
                                                    </span>
                                                    <div className="flex items-center gap-1">
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            className="h-8 rounded-lg px-2 text-xs font-bold"
                                                            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                                                            disabled={currentPage <= 1}
                                                        >
                                                            Prev
                                                        </Button>
                                                        <div className="flex h-8 items-center rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-3 text-xs font-bold">
                                                            {currentPage} <span className="mx-1 text-slate-400">of</span> {totalPages}
                                                        </div>
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            className="h-8 rounded-lg px-2 text-xs font-bold"
                                                            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                                                            disabled={currentPage >= totalPages}
                                                        >
                                                            Next
                                                        </Button>
                                                    </div>
                                                </div>
                                            </div>
                                        </CardContent>
                                    </Card>
                                </div>

                                {/* RIGHT COLUMN: STATS & BREAKDOWN (4/12) */}
                                <div className="lg:col-span-4 flex flex-col gap-6">
                                    {/* Live Stats Card */}
                                    <Card className="border-slate-200 dark:border-slate-800 shadow-sm">
                                        <CardHeader className="border-b border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900/30 px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-50 dark:bg-blue-900/30">
                                                    <Users className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                                                </div>
                                                <CardTitle className="text-base font-bold">Live Stats</CardTitle>
                                            </div>
                                        </CardHeader>
                                        <CardContent className="p-6">
                                            <div className="grid grid-cols-1 gap-4">
                                                <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700/50 flex items-center justify-between">
                                                    <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Total Checked In</span>
                                                    <span className="text-2xl font-black text-slate-900 dark:text-white">{liveCounts.total}</span>
                                                </div>
                                                <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-100 dark:border-emerald-800 flex items-center justify-between">
                                                    <span className="text-xs font-bold text-emerald-700 dark:text-emerald-400 uppercase tracking-wider">Present</span>
                                                    <span className="text-2xl font-black text-emerald-700 dark:text-emerald-300">{liveCounts.present}</span>
                                                </div>
                                                <div className="p-4 rounded-xl bg-amber-50 dark:bg-amber-900/20 border border-amber-100 dark:border-amber-800 flex items-center justify-between">
                                                    <span className="text-xs font-bold text-amber-700 dark:text-amber-400 uppercase tracking-wider">Late</span>
                                                    <span className="text-2xl font-black text-amber-700 dark:text-amber-300">{liveCounts.late}</span>
                                                </div>
                                            </div>
                                        </CardContent>
                                    </Card>

                                    {/* Attendance by Program */}
                                    {byCourse.length > 0 && (
                                        <Card className="overflow-hidden border-slate-200 dark:border-slate-800 shadow-sm">
                                            <CardHeader className="border-b border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900/30 px-6 py-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-50 dark:bg-blue-900/30">
                                                        <BarChart3 className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                                                    </div>
                                                    <CardTitle className="text-base font-bold">Attendance by Program</CardTitle>
                                                </div>
                                            </CardHeader>
                                            <CardContent className="p-0">
                                                <div className="overflow-x-auto">
                                                    <table className="w-full">
                                                        <thead className="bg-slate-50/50 dark:bg-slate-900/50 border-b border-slate-100 dark:border-slate-800">
                                                            <tr>
                                                                <th className="px-6 py-4 text-left text-[10px] font-black uppercase tracking-[0.15em] text-slate-500">Program</th>
                                                                <th className="px-6 py-4 text-right text-[10px] font-black uppercase tracking-[0.15em] text-slate-500">Scanned</th>
                                                                <th className="px-6 py-4 text-right text-[10px] font-black uppercase tracking-[0.15em] text-slate-500">Progress</th>
                                                            </tr>
                                                        </thead>
                                                        <tbody className="divide-y divide-slate-50 dark:divide-slate-800">
                                                            {byCourse.map((course) => (
                                                                <tr key={(course as any).program} className="group hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-all duration-200">
                                                                    <td className="px-6 py-4">
                                                                        <div className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-tight">{(course as any).program}</div>
                                                                    </td>
                                                                    <td className="px-6 py-4 text-right">
                                                                        <span className="text-sm font-black text-blue-600 dark:text-blue-400">{Number((course as any).scanned).toLocaleString()}</span>
                                                                    </td>
                                                                    <td className="px-6 py-4 text-right w-32">
                                                                        <div className="flex flex-col gap-2">
                                                                            <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-widest">
                                                                                <span className="text-blue-600 dark:text-blue-400">{Math.min(Number((course as any).percentage ?? 0), 100)}%</span>
                                                                            </div>
                                                                            <div className="h-2 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden border border-slate-200/50 dark:border-slate-700/50 shadow-inner">
                                                                                <div
                                                                                    className="h-full bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full transition-all duration-1000 ease-out shadow-[0_0_10px_rgba(59,130,246,0.5)]"
                                                                                    style={{ width: `${Math.min(Number((course as any).percentage ?? 0), 100)}%` }}
                                                                                />
                                                                            </div>
                                                                        </div>
                                                                    </td>
                                                                </tr>
                                                            ))}
                                                        </tbody>
                                                    </table>
                                                </div>
                                            </CardContent>
                                        </Card>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Course Students Modal */}
                    <Dialog open={showCourseStudentsModal} onOpenChange={setShowCourseStudentsModal}>
                        <DialogContent className="w-[96vw] !max-w-6xl max-h-[85vh] overflow-hidden bg-white dark:bg-[#0B192C] p-0 rounded-[2rem] border-slate-200 dark:border-slate-800 shadow-2xl">
                            <DialogHeader className="border-b border-slate-50 dark:border-slate-800/50 bg-slate-50/30 dark:bg-slate-900/30 px-8 py-6">
                                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2.5 rounded-xl bg-blue-600/10 dark:bg-blue-600/20 text-blue-600 dark:text-blue-400">
                                            <Users className="h-5 w-5" />
                                        </div>
                                        <div>
                                            <DialogTitle className="text-xl font-black tracking-tight text-slate-900 dark:text-white uppercase">
                                                {selectedCourse ? `Students - ${selectedCourse}` : 'Students'}
                                            </DialogTitle>
                                            <p className="mt-1 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Participant List</p>
                                        </div>
                                    </div>

                                    <div className="flex flex-wrap items-center gap-3">
                                        <Badge className="bg-blue-500/10 text-blue-600 border-blue-500/20 font-black text-[10px] uppercase tracking-wider px-3 py-1.5 rounded-lg">
                                            {courseStudentsRows.length.toLocaleString()} Total
                                        </Badge>
                                        <Badge className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20 font-black text-[10px] uppercase tracking-wider px-3 py-1.5 rounded-lg">
                                            {courseStudentsRows.filter((r) => r.scanned).length.toLocaleString()} Scanned
                                        </Badge>
                                    </div>
                                </div>
                            </DialogHeader>

                            <div className="p-8">
                                <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                                    <div className="flex items-center gap-2">
                                        <Info className="h-4 w-4 text-blue-500" />
                                        <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Filter by Year Level</span>
                                    </div>
                                    <select
                                        value={courseStudentsYearFilter}
                                        onChange={(e) => setCourseStudentsYearFilter(e.target.value)}
                                        className="h-10 w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-4 text-xs font-bold text-slate-700 dark:text-slate-300 focus:ring-2 focus:ring-blue-500/20 sm:w-[220px]"
                                    >
                                        <option value="all">All Year Levels</option>
                                        <option value="1">1st Year</option>
                                        <option value="2">2nd Year</option>
                                        <option value="3">3rd Year</option>
                                        <option value="4">4th Year</option>
                                    </select>
                                </div>

                                {courseStudentsLoading ? (
                                    <div className="flex flex-col items-center justify-center py-20 gap-4">
                                        <div className="h-10 w-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                                        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Syncing database...</p>
                                    </div>
                                ) : courseStudentsError ? (
                                    <div className="flex flex-col items-center justify-center py-20 text-center gap-4">
                                        <div className="h-12 w-12 rounded-2xl bg-rose-500/10 flex items-center justify-center text-rose-500">
                                            <AlertCircle className="h-6 w-6" />
                                        </div>
                                        <p className="text-sm font-black text-rose-600">{courseStudentsError}</p>
                                    </div>
                                ) : (
                                    <div className="overflow-hidden rounded-[2rem] border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900/50">
                                        <div className="overflow-x-auto max-h-[400px]">
                                            <table className="w-full text-left">
                                                <thead className="sticky top-0 bg-slate-50 dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800 z-10">
                                                    <tr>
                                                        <th className="px-8 py-4 text-[10px] font-black uppercase tracking-[0.15em] text-slate-500">Student ID</th>
                                                        <th className="px-8 py-4 text-[10px] font-black uppercase tracking-[0.15em] text-slate-500">Name</th>
                                                        <th className="px-8 py-4 text-[10px] font-black uppercase tracking-[0.15em] text-slate-500">Year</th>
                                                        <th className="px-8 py-4 text-[10px] font-black uppercase tracking-[0.15em] text-slate-500 text-right">Status</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-slate-50 dark:divide-slate-800">
                                                    {(() => {
                                                        const filteredRows = courseStudentsYearFilter === 'all'
                                                            ? courseStudentsRows
                                                            : courseStudentsRows.filter((row) => {
                                                                  const raw = String(row.year_level ?? '').toLowerCase();
                                                                  return raw.includes(courseStudentsYearFilter);
                                                              });
                                                        
                                                        return filteredRows.length ? (
                                                            filteredRows.map((row) => (
                                                                <tr key={row.id} className="group hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-all duration-200">
                                                                    <td className="px-8 py-4 text-sm font-black text-slate-900 dark:text-white">{row.student_id || '—'}</td>
                                                                    <td className="px-8 py-4 text-sm font-bold text-slate-600 dark:text-slate-400 group-hover:text-slate-900 dark:group-hover:text-white transition-colors">{row.name || '—'}</td>
                                                                    <td className="px-8 py-4 text-sm font-black text-slate-500 dark:text-slate-500">{row.year_level || '—'}</td>
                                                                    <td className="px-8 py-4 text-right">
                                                                        {row.scanned ? (
                                                                            <Badge className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20 font-black text-[10px] uppercase tracking-wider rounded-lg">
                                                                                <CheckCircle2 className="h-3 w-3 mr-1.5" />
                                                                                Scanned
                                                                            </Badge>
                                                                        ) : (
                                                                            <Badge variant="outline" className="text-slate-400 border-slate-200 font-black text-[10px] uppercase tracking-wider rounded-lg">
                                                                                Not Scanned
                                                                            </Badge>
                                                                        )}
                                                                    </td>
                                                                </tr>
                                                            ))
                                                        ) : (
                                                            <tr>
                                                                <td colSpan={4} className="px-8 py-16 text-center opacity-30">
                                                                    <Users className="h-10 w-10 mx-auto mb-2" />
                                                                    <p className="text-[10px] font-black uppercase tracking-widest">No students found</p>
                                                                </td>
                                                            </tr>
                                                        );
                                                    })()}
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
        </AdminLayout>
    );
}
