import { Head, Link, usePage } from '@inertiajs/react';
import { BrowserQRCodeReader } from '@zxing/browser';
import { ArrowLeft, QrCode, ShieldAlert } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import Swal from 'sweetalert2';
import { AppShell } from '@/components/app-shell';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { studentAttendanceScan, studentDashboard } from '@/routes';
import type { SharedData } from '@/types';

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
    name: string;
    program: string;
    time: string;
    status: 'valid' | 'invalid' | 'late';
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
    };
    initialLogRows?: AttendanceLogRow[];
    securityAlerts?: SecurityAlert[];
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

export default function StudentAttendanceScannerPortalPage({
    event,
    initialLogRows,
    securityAlerts: initialSecurityAlerts = [],
}: Props) {
    const page = usePage<SharedData>();
    const videoRef = useRef<HTMLVideoElement | null>(null);
    const streamRef = useRef<MediaStream | null>(null);
    const intervalRef = useRef<number | null>(null);
    const zxingRef = useRef<{
        reader: BrowserQRCodeReader;
        stop: () => void;
    } | null>(null);
    const lastValueRef = useRef<{ value: string; at: number } | null>(null);
    const timerRef = useRef<number | null>(null);

    const [securityAlerts, setSecurityAlerts] = useState<SecurityAlert[]>(initialSecurityAlerts);
    const [scannerRemaining, setScannerRemaining] = useState<number | null>(null);

    const isScannerBlocked = (scannerRemaining ?? 0) > 0;

    useEffect(() => {
        const interval = setInterval(async () => {
            try {
                const res = await fetch('/api/auth/status/scanner-block', {
                    headers: { 'X-Requested-With': 'XMLHttpRequest' },
                });
                if (res.ok) {
                    const data = await res.json();
                    setScannerRemaining(data.scanner_blocked && data.remaining_seconds > 0 ? data.remaining_seconds : null);
                }
            } catch {
                // silent
            }
        }, 3000);

        return () => clearInterval(interval);
    }, []);

    useEffect(() => {
        const flashError = (page.props as any)?.flash?.error;
        if (typeof flashError === 'string' && flashError.trim() !== '') {
            Swal.fire({
                icon: 'info',
                title: 'Scanner Portal Closed',
                text: flashError,
            });
        }
    }, [page.props]);

    useEffect(() => {
        const interval = setInterval(async () => {
            try {
                const res = await fetch('/api/security-alerts', {
                    headers: { 'X-Requested-With': 'XMLHttpRequest' },
                });
                if (res.ok) {
                    const data = await res.json();
                    const freshAlerts = (data.alerts ?? []).filter((a: SecurityAlert) => {
                        const alertTime = Date.parse(a.timestamp);
                        if (!Number.isFinite(alertTime)) return false;
                        const windowMs = (a.window_minutes ?? 15) * 60 * 1000;
                        return Date.now() - alertTime < windowMs;
                    });
                    setSecurityAlerts(freshAlerts);
                }
            } catch {
                // silent
            }
        }, 15000);

        return () => clearInterval(interval);
    }, []);

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

    const [scanState, setScanState] = useState<ScanState>({ status: 'idle' });
    const [logRows, setLogRows] = useState<AttendanceLogRow[]>(
        initialLogRows ?? [],
    );
    const [lastScanned, setLastScanned] = useState<AttendanceLogRow | null>(
        (initialLogRows ?? [])[0] ?? null,
    );

    const barcodeDetectorSupported = useMemo(() => {
        return typeof window !== 'undefined' && 'BarcodeDetector' in window;
    }, []);

    const attendanceAlerts = securityAlerts.filter(
        (a) => a.module === 'Attendance' && (a.action === 'Access Denied' || a.action === 'Denied'),
    );

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

    const stop = () => {
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

    const handleDecodedValue = async (rawValue: string) => {
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
            const token = (
                document.querySelector(
                    'meta[name="csrf-token"]',
                ) as HTMLMetaElement | null
            )?.content;

            const geo = await getGeo();
            if (!geo) {
                const time = new Date().toLocaleTimeString([], {
                    hour: 'numeric',
                    minute: '2-digit',
                });
                const next: AttendanceLogRow = {
                    id: value,
                    name: 'Location is required. Please enable GPS/location permission and try again.',
                    program: '—',
                    time,
                    status: 'invalid',
                };

                setLastScanned(next);
                setLogRows((prev) => [next, ...prev]);
                return;
            }

            const res = await fetch(studentAttendanceScan(event.id), {
                method: 'POST',
                credentials: 'include',
                headers: {
                    Accept: 'application/json',
                    'Content-Type': 'application/json',
                    'X-Requested-With': 'XMLHttpRequest',
                    ...(token ? { 'X-CSRF-TOKEN': token } : {}),
                },
                body: JSON.stringify({ value, ...geo }),
            });

            const payload = await res.json().catch(() => ({}) as any);

            if (!res.ok) {
                const time = new Date().toLocaleTimeString([], {
                    hour: 'numeric',
                    minute: '2-digit',
                });
                const next: AttendanceLogRow = {
                    id: value,
                    name: String(payload?.message ?? value),
                    program: '—',
                    time,
                    status: 'invalid',
                };

                setLastScanned(next);
                setLogRows((prev) => [next, ...prev]);
                return;
            }

            const time = new Date().toLocaleTimeString([], {
                hour: 'numeric',
                minute: '2-digit',
            });
            const next: AttendanceLogRow = {
                id: String(payload?.student?.student_id ?? value),
                name: String(payload?.student?.name ?? value),
                program: String(payload?.student?.program ?? '—') || '—',
                time,
                status: payload?.status === 'late' ? 'late' : 'valid',
            };

            setLastScanned(next);
            setLogRows((prev) => [next, ...prev]);
        } catch (e: any) {
            const time = new Date().toLocaleTimeString([], {
                hour: 'numeric',
                minute: '2-digit',
            });
            const next: AttendanceLogRow = {
                id: value,
                name: e?.message ? String(e.message) : value,
                program: '—',
                time,
                status: 'invalid',
            };

            setLastScanned(next);
            setLogRows((prev) => [next, ...prev]);
        }
    };

    const start = async () => {
        if (event.scannerPortalActive === false) {
            setScanState({
                status: 'error',
                message: 'Scanner portal is not activated yet.',
            });
            return;
        }

        if (scanBlocked) {
            setScanState({
                status: 'error',
                message:
                    'Scanning is disabled 30 minutes after the registration end time.',
            });
            return;
        }

        setScanState({ status: 'starting' });

        try {
            const video = videoRef.current;
            if (!video) {
                setScanState({
                    status: 'error',
                    message: 'Video element not available.',
                });
                return;
            }

            const stream = await navigator.mediaDevices.getUserMedia({
                video: {
                    facingMode: { ideal: 'environment' },
                },
                audio: false,
            });
            streamRef.current = stream;

            video.srcObject = stream;
            await video.play();

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
                    if (!v) return;
                    if (v.readyState < 2) return;
                    try {
                        const results = await detector.detect(v);
                        const value = results?.[0]?.rawValue;
                        if (value) handleDecodedValue(value);
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
                        if (value) handleDecodedValue(value);
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
        } catch (e: any) {
            console.error(
                '[ScannerPortal][start] getUserMedia/start error:',
                e,
            );
            stop();
            setScanState({
                status: 'error',
                message: e?.message ?? 'Unable to access camera.',
            });
        }
    };

    useEffect(() => {
        if (event.scannerPortalActive === false) {
            return () => stop();
        }

        void start();
        return () => stop();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    return (
        <AppShell>
            <Head title="Attendance Scanner Portal" />

            <div className="relative min-h-screen overflow-x-hidden bg-slate-50 transition-colors duration-500 dark:bg-[#020617]">
                {/* Visual Depth Layers - Mesh Gradients */}
                <div className="pointer-events-none fixed inset-0 overflow-hidden">
                    <div className="absolute top-[-10%] left-[-10%] h-[50%] w-[50%] animate-pulse rounded-full bg-blue-600/10 mix-blend-multiply blur-[120px] dark:bg-blue-600/5 dark:mix-blend-soft-light" />
                    <div className="absolute right-[-10%] bottom-[-10%] h-[50%] w-[50%] rounded-full bg-indigo-600/10 mix-blend-multiply blur-[120px] dark:bg-indigo-600/5 dark:mix-blend-soft-light" />
                    <div className="absolute top-[20%] right-[10%] h-[30%] w-[30%] rounded-full bg-emerald-600/5 blur-[100px] dark:bg-emerald-600/5" />
                </div>

                <div className="relative z-10 mx-auto flex w-full max-w-7xl flex-col gap-6 px-4 py-8 sm:px-6 lg:px-8">
                    <div className="overflow-hidden rounded-2xl bg-gradient-to-r from-[#0b2d66] to-[#1e40af] px-6 py-5 text-white shadow-sm">
                        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                            <div>
                                <Button
                                    type="button"
                                    variant="ghost"
                                    className="h-9 justify-start gap-2 rounded-md bg-white/10 px-3 text-white hover:bg-white/20 hover:text-white"
                                    asChild
                                >
                                    <Link href={studentDashboard()}>
                                        <ArrowLeft className="h-4 w-4" />
                                        Back
                                    </Link>
                                </Button>
                                <div className="mt-3 text-lg font-semibold">
                                    Attendance Scanner Portal - {event.name}
                                </div>
                                <div className="mt-1 text-sm text-white/80">
                                    {event.date}
                                </div>
                            </div>
                        </div>

                        {attendanceAlerts.length > 0 && (
                            <div className="mt-3 flex items-start gap-3 rounded-xl border border-rose-200/30 bg-rose-900/30 px-4 py-3">
                                <ShieldAlert className="mt-0.5 h-5 w-5 shrink-0 text-rose-300" />
                                <div>
                                    <div className="text-sm font-semibold text-rose-200">
                                        Security Alert
                                    </div>
                                    <div className="mt-0.5 text-xs text-rose-100">
                                        {attendanceAlerts[0].recent_count
                                            ? `${attendanceAlerts[0].recent_count} denied attendance attempts in the last ${attendanceAlerts[0].window_minutes ?? 15} minutes.`
                                            : attendanceAlerts[0].details}
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="flex flex-wrap items-center gap-3 rounded-xl border border-slate-200 bg-white px-5 py-4 shadow-sm">
                        <div className="text-sm font-semibold text-slate-700">
                            Scanner Status:
                        </div>
                        {event.scannerPortalActive === false ? (
                            <div className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-800">
                                <span className="h-2 w-2 rounded-full bg-slate-600" />
                                NOT ACTIVATED
                            </div>
                        ) : null}
                        {scanState.status === 'running' ? (
                            <div className="inline-flex items-center gap-2 rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-800">
                                <span className="h-2 w-2 rounded-full bg-emerald-600" />
                                ACTIVE
                            </div>
                        ) : scanState.status === 'starting' ? (
                            <div className="inline-flex items-center gap-2 rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-800">
                                <span className="h-2 w-2 rounded-full bg-amber-600" />
                                STARTING
                            </div>
                        ) : scanState.status === 'error' ? (
                            <div className="inline-flex items-center gap-2 rounded-full bg-rose-100 px-3 py-1 text-xs font-semibold text-rose-800">
                                <span className="h-2 w-2 rounded-full bg-rose-600" />
                                ERROR
                            </div>
                        ) : (
                            <div className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-800">
                                <span className="h-2 w-2 rounded-full bg-slate-600" />
                                IDLE
                            </div>
                        )}

                        <div className="ml-auto flex flex-wrap items-center gap-2">
                            <Button
                                type="button"
                                size="sm"
                                className="h-9 bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-50"
                                onClick={start}
                                disabled={
                                    event.scannerPortalActive === false ||
                                    scanBlocked ||
                                    isScannerBlocked ||
                                    scanState.status === 'starting' ||
                                    scanState.status === 'running'
                                }
                            >
                                {isScannerBlocked
                                    ? `Blocked (${scannerRemaining}s)`
                                    : scanState.status === 'starting'
                                        ? 'Starting...'
                                        : scanState.status === 'running'
                                            ? 'Running'
                                            : 'Start'}
                            </Button>
                            <Button
                                type="button"
                                size="sm"
                                variant="outline"
                                className="h-9"
                                onClick={stop}
                                disabled={event.scannerPortalActive === false}
                            >
                                Stop
                            </Button>
                        </div>
                    </div>

                    {event.scannerPortalActive === false ? (
                        <div className="rounded-xl border border-amber-200 bg-amber-50 px-5 py-4 text-sm font-semibold text-amber-900">
                            Scanner portal is not activated yet. Please wait for
                            the admin to activate it.
                        </div>
                    ) : null}

                    {event.scannerPortalActive !== false && scanBlocked ? (
                        <div className="rounded-xl border border-rose-200 bg-rose-50 px-5 py-4 text-sm font-semibold text-rose-900">
                            Scanning is disabled 30 minutes after the
                            registration end time.
                        </div>
                    ) : null}

                    {isScannerBlocked ? (
                        <div className="rounded-xl border border-amber-200 bg-amber-50 px-5 py-4 text-sm font-semibold text-amber-900">
                            Scanner temporarily blocked due to repeated denials. Please wait {scannerRemaining}s before scanning again.
                        </div>
                    ) : null}

                    <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
                        <div className="lg:col-span-8">
                            <Card className="border-0 shadow-lg">
                                <CardContent className="space-y-4 pt-6">
                                    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
                                        <div className="relative aspect-[16/9] w-full">
                                            <video
                                                ref={videoRef}
                                                className="absolute inset-0 h-full w-full object-cover"
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
                                        </div>
                                        {lastScanned ? (
                                            <div
                                                className={
                                                    'px-6 py-3 text-center text-sm font-semibold text-white ' +
                                                    (lastScanned.status ===
                                                        'valid' ||
                                                    lastScanned.status ===
                                                        'late'
                                                        ? 'bg-emerald-700/90'
                                                        : 'bg-rose-700/90')
                                                }
                                            >
                                                {lastScanned.status ===
                                                    'valid' ||
                                                lastScanned.status === 'late'
                                                    ? 'Valid'
                                                    : 'Invalid'}{' '}
                                                - {lastScanned.name}
                                            </div>
                                        ) : (
                                            <div className="bg-slate-900/60 px-6 py-3 text-center text-sm font-semibold text-white">
                                                Scan a QR code to begin
                                            </div>
                                        )}
                                    </div>
                                </CardContent>
                            </Card>
                        </div>

                        <div className="space-y-4 lg:col-span-4">
                            <Card className="border-0 shadow-lg">
                                <CardHeader className="pb-3">
                                    <CardTitle className="text-base font-semibold text-slate-800">
                                        Event Details
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="pt-0">
                                    <div className="space-y-3 rounded-xl border border-slate-200 bg-white p-4">
                                        <div>
                                            <div className="text-xs font-semibold text-slate-500">
                                                Event
                                            </div>
                                            <div className="mt-1 text-lg font-semibold text-slate-900">
                                                {event.name}
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-2 gap-4 text-sm">
                                            <div>
                                                <div className="text-xs font-semibold text-slate-500">
                                                    Date
                                                </div>
                                                <div className="mt-1 font-semibold text-slate-800">
                                                    {event.date || '—'}
                                                </div>
                                            </div>
                                            <div>
                                                <div className="text-xs font-semibold text-slate-500">
                                                    Location
                                                </div>
                                                <div className="mt-1 font-semibold text-slate-800">
                                                    {event.location || '—'}
                                                </div>
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-2 gap-4 text-sm">
                                            <div>
                                                <div className="text-xs font-semibold text-slate-500">
                                                    Time In
                                                </div>
                                                <div className="mt-1 font-semibold text-slate-800">
                                                    {formatTime12h(
                                                        event.timeIn,
                                                    )}
                                                </div>
                                            </div>
                                            <div>
                                                <div className="text-xs font-semibold text-slate-500">
                                                    Time End
                                                </div>
                                                <div className="mt-1 font-semibold text-slate-800">
                                                    {formatTime12h(
                                                        event.timeEnd,
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                    </div>
                </div>
            </div>
        </AppShell>
    );
}
