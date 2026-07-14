import { Head, Link } from '@inertiajs/react';
import { BrowserQRCodeReader } from '@zxing/browser';
import {
    ArrowLeft,
    CheckCircle2,
    Clock,
    Loader2,
    MapPin,
    QrCode,
    ShieldAlert,
    XCircle,
} from 'lucide-react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Swal from 'sweetalert2';
import { AppShell } from '@/components/app-shell';
import { studentAttendanceDynamicQrScan, studentDashboard } from '@/routes';

// ── Types ─────────────────────────────────────────────────────────────────────

type Props = {
    event: {
        id: number | string;
        name: string;
        date?: string | null;
        location?: string | null;
        geofenceEnabled?: boolean;
        geofenceLatitude?: number | null;
        geofenceLongitude?: number | null;
        geofenceRadiusM?: number;
        scannerPortalActive: boolean;
    };
};

type ScanPhase =
    | 'idle'
    | 'requesting-location'
    | 'camera-starting'
    | 'scanning'
    | 'submitting'
    | 'success'
    | 'error';

type GeoResult = { latitude: number; longitude: number; accuracy_m: number } | null;

// ── GPS helper ────────────────────────────────────────────────────────────────

const getGeo = (): Promise<GeoResult> =>
    new Promise((resolve) => {
        if (!('geolocation' in navigator)) return resolve(null);
        navigator.geolocation.getCurrentPosition(
            (pos) =>
                resolve({
                    latitude:   pos.coords.latitude,
                    longitude:  pos.coords.longitude,
                    accuracy_m: pos.coords.accuracy,
                }),
            () => resolve(null),
            { enableHighAccuracy: true, timeout: 10_000, maximumAge: 0 },
        );
    });

// ── CSRF helper ───────────────────────────────────────────────────────────────

const csrfToken = () =>
    (document.querySelector('meta[name="csrf-token"]') as HTMLMetaElement | null)?.content ?? '';

// ── Component ─────────────────────────────────────────────────────────────────

export default function StudentDynamicQrScanPage({ event }: Props) {
    const videoRef    = useRef<HTMLVideoElement | null>(null);
    const streamRef   = useRef<MediaStream | null>(null);
    const zxingRef    = useRef<{ stop: () => void } | null>(null);
    const barcodeIntervalRef = useRef<number | null>(null);
    const lastTokenRef = useRef<{ value: string; at: number } | null>(null);

    const [phase,       setPhase]       = useState<ScanPhase>('idle');
    const [errorMsg,    setErrorMsg]    = useState<string>('');
    const [geo,         setGeo]         = useState<GeoResult>(null);
    const [geoStatus,   setGeoStatus]   = useState<'pending' | 'ok' | 'missing'>('pending');
    const [successData, setSuccessData] = useState<{ name: string; status: string } | null>(null);

    // ── Barcode Detector API support ───────────────────────────────────────────
    const barcodeApiSupported = useMemo(
        () => typeof window !== 'undefined' && 'BarcodeDetector' in window,
        [],
    );

    // ── Stop camera ───────────────────────────────────────────────────────────
    const stopCamera = useCallback(() => {
        if (barcodeIntervalRef.current != null) {
            window.clearInterval(barcodeIntervalRef.current);
            barcodeIntervalRef.current = null;
        }
        zxingRef.current?.stop();
        zxingRef.current = null;
        streamRef.current?.getTracks().forEach((t) => t.stop());
        streamRef.current = null;
        if (videoRef.current) videoRef.current.srcObject = null;
    }, []);

    useEffect(() => () => stopCamera(), [stopCamera]);

    // ── Acquire GPS location ───────────────────────────────────────────────────
    useEffect(() => {
        setGeoStatus('pending');
        void getGeo().then((result) => {
            setGeo(result);
            setGeoStatus(result ? 'ok' : 'missing');
        });
    }, []);

    // ── Submit token to server ─────────────────────────────────────────────────
    const submitToken = useCallback(
        async (rawQrPayload: string) => {
            // Debounce: ignore the same token within 2 s
            const now = Date.now();
            if (
                lastTokenRef.current?.value === rawQrPayload &&
                now - lastTokenRef.current.at < 2_000
            )
                return;
            lastTokenRef.current = { value: rawQrPayload, at: now };

            // Parse JSON payload from QR
            let token: string | null = null;
            let qrEventId: number | null = null;
            try {
                const parsed = JSON.parse(rawQrPayload);
                if (parsed?.type === 'dsams-attendance-token') {
                    token      = String(parsed.token ?? '');
                    qrEventId  = Number(parsed.event_id ?? 0);
                }
            } catch {
                // not JSON — ignore
            }

            if (!token) return; // not a DSAMS QR

            // Validate event match early on client side
            if (qrEventId !== null && qrEventId !== Number(event.id)) {
                void Swal.fire({
                    icon: 'error',
                    title: 'Wrong Event',
                    text: 'This QR code belongs to a different event.',
                    confirmButtonColor: '#6366f1',
                });
                return;
            }

            stopCamera();
            setPhase('submitting');

            // Refresh GPS right before submitting if we already have a result
            const freshGeo = (await getGeo()) ?? geo;

            try {
                const body: Record<string, unknown> = { token };
                if (freshGeo) {
                    body.latitude   = freshGeo.latitude;
                    body.longitude  = freshGeo.longitude;
                    body.accuracy_m = freshGeo.accuracy_m;
                }

                const res = await fetch(studentAttendanceDynamicQrScan(event.id), {
                    method:      'POST',
                    credentials: 'include',
                    headers: {
                        Accept:            'application/json',
                        'Content-Type':    'application/json',
                        'X-Requested-With': 'XMLHttpRequest',
                        'X-CSRF-TOKEN':    csrfToken(),
                    },
                    body: JSON.stringify(body),
                });

                const data = await res.json().catch(() => ({}));

                if (res.ok) {
                    setSuccessData({
                        name:   String(data?.student?.name ?? 'You'),
                        status: String(data?.status ?? 'present'),
                    });
                    setPhase('success');
                } else {
                    const message = String(
                        (data as any)?.message ?? 'Something went wrong. Please try again.',
                    );

                    if (res.status === 409) {
                        // Already checked in — show as success (idempotent)
                        setSuccessData({ name: 'You', status: 'already-checked-in' });
                        setPhase('success');
                    } else {
                        setErrorMsg(message);
                        setPhase('error');
                    }
                }
            } catch (e: any) {
                setErrorMsg(e?.message ?? 'Network error. Please try again.');
                setPhase('error');
            }
        },
        [event.id, geo, stopCamera],
    );

    // ── Start camera ──────────────────────────────────────────────────────────
    const startCamera = useCallback(async () => {
        if (!event.scannerPortalActive) {
            setErrorMsg('The attendance session is not active yet. Please wait for the admin to start it.');
            setPhase('error');
            return;
        }

        setPhase('camera-starting');
        setErrorMsg('');
        setSuccessData(null);

        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                video: { facingMode: { ideal: 'environment' } },
                audio: false,
            });
            streamRef.current = stream;

            const video = videoRef.current!;
            video.srcObject = stream;
            await video.play();

            setPhase('scanning');

            if (barcodeApiSupported) {
                const Detector = (window as any).BarcodeDetector as new (o: {
                    formats: string[];
                }) => { detect: (src: CanvasImageSource) => Promise<{ rawValue?: string }[]> };
                const detector = new Detector({ formats: ['qr_code'] });

                barcodeIntervalRef.current = window.setInterval(async () => {
                    const v = videoRef.current;
                    if (!v || v.readyState < 2) return;
                    try {
                        const results = await detector.detect(v);
                        const value = results?.[0]?.rawValue;
                        if (value) void submitToken(value);
                    } catch {
                        // ignore
                    }
                }, 250);
            } else {
                const reader = new BrowserQRCodeReader();
                const controls = await reader.decodeFromVideoDevice(
                    undefined,
                    video,
                    (result) => {
                        const value = result?.getText?.() ?? '';
                        if (value) void submitToken(value);
                    },
                );
                zxingRef.current = { stop: () => { try { controls.stop(); } catch { /**/ } } };
            }
        } catch (e: any) {
            stopCamera();
            setErrorMsg(e?.message ?? 'Unable to access camera. Please allow camera permissions.');
            setPhase('error');
        }
    }, [event.scannerPortalActive, barcodeApiSupported, submitToken, stopCamera]);

    const reset = () => {
        stopCamera();
        setPhase('idle');
        setErrorMsg('');
        setSuccessData(null);
        lastTokenRef.current = null;
    };

    // ── Derived UI state ──────────────────────────────────────────────────────
    const isScanning  = phase === 'scanning';
    const isSubmitting = phase === 'submitting';
    const isIdle       = phase === 'idle' || phase === 'camera-starting';

    return (
        <AppShell>
            <Head title={`Scan Attendance — ${event.name}`} />

            {/* Background */}
            <div className="relative min-h-screen overflow-x-hidden bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950">
                <div className="pointer-events-none fixed inset-0 overflow-hidden">
                    <div className="absolute top-[-20%] left-[-10%] h-[60%] w-[60%] rounded-full bg-indigo-600/10 blur-[150px]" />
                    <div className="absolute right-[-10%] bottom-[-20%] h-[60%] w-[60%] rounded-full bg-blue-600/10 blur-[150px]" />
                </div>

                <div className="relative z-10 mx-auto flex w-full max-w-lg flex-col gap-6 px-4 py-8">
                    {/* ── Header ─────────────────────────────────────────────── */}
                    <div className="overflow-hidden rounded-2xl bg-gradient-to-r from-indigo-600 to-blue-600 px-6 py-5 text-white shadow-xl shadow-indigo-900/40">
                        <Link
                            href={studentDashboard()}
                            className="inline-flex items-center gap-2 rounded-lg bg-white/10 px-3 py-1.5 text-xs font-medium text-white/80 transition hover:bg-white/20 hover:text-white"
                        >
                            <ArrowLeft className="h-3.5 w-3.5" />
                            Dashboard
                        </Link>
                        <h1 className="mt-3 text-lg font-bold">Scan Attendance QR</h1>
                        <p className="mt-1 text-sm text-indigo-100/80">{event.name}</p>
                        {event.date && (
                            <p className="mt-0.5 text-xs text-indigo-100/60">{event.date}</p>
                        )}
                    </div>

                    {/* ── GPS status bar ─────────────────────────────────────── */}
                    <div className={`flex items-center gap-3 rounded-xl px-4 py-3 text-sm ${
                        geoStatus === 'ok'
                            ? 'bg-emerald-500/10 text-emerald-300 ring-1 ring-emerald-500/20'
                            : geoStatus === 'missing'
                            ? 'bg-amber-500/10 text-amber-300 ring-1 ring-amber-500/20'
                            : 'bg-white/5 text-white/40 ring-1 ring-white/10'
                    }`}>
                        <MapPin className="h-4 w-4 shrink-0" />
                        {geoStatus === 'ok'
                            ? `GPS acquired (±${Math.round(geo!.accuracy_m)}m)`
                            : geoStatus === 'missing'
                            ? event.geofenceEnabled
                                ? 'GPS unavailable — attendance requires location for this event'
                                : 'GPS unavailable (not required for this event)'
                            : 'Acquiring GPS…'}
                    </div>

                    {/* ── Session status ─────────────────────────────────────── */}
                    {!event.scannerPortalActive && (
                        <div className="flex items-center gap-3 rounded-xl bg-rose-500/10 px-4 py-3 text-sm text-rose-300 ring-1 ring-rose-500/20">
                            <ShieldAlert className="h-4 w-4 shrink-0" />
                            The attendance session is not active yet. Wait for your admin to start it.
                        </div>
                    )}

                    {/* ── Camera / result panel ──────────────────────────────── */}
                    <div className="overflow-hidden rounded-2xl bg-white/5 ring-1 ring-white/10">
                        {/* Camera viewport */}
                        <div className="relative aspect-square w-full bg-slate-900">
                            <video
                                ref={videoRef}
                                className="absolute inset-0 h-full w-full object-cover"
                                playsInline
                                muted
                            />

                            {/* Overlay when not actively scanning */}
                            {!isScanning && (
                                <div className="absolute inset-0 flex items-center justify-center bg-slate-950/80">
                                    {phase === 'camera-starting' ? (
                                        <div className="flex flex-col items-center gap-3 text-white">
                                            <Loader2 className="h-12 w-12 animate-spin text-indigo-400" />
                                            <span className="text-sm font-medium">Starting camera…</span>
                                        </div>
                                    ) : phase === 'submitting' ? (
                                        <div className="flex flex-col items-center gap-3 text-white">
                                            <Loader2 className="h-12 w-12 animate-spin text-indigo-400" />
                                            <span className="text-sm font-medium">Recording attendance…</span>
                                        </div>
                                    ) : phase === 'success' ? (
                                        <div className="flex flex-col items-center gap-4 px-6 text-center">
                                            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-emerald-500/20 ring-4 ring-emerald-500/30">
                                                <CheckCircle2 className="h-10 w-10 text-emerald-400" />
                                            </div>
                                            <div>
                                                <div className="text-lg font-bold text-emerald-300">
                                                    {successData?.status === 'already-checked-in'
                                                        ? 'Already Checked In'
                                                        : 'Attendance Recorded!'}
                                                </div>
                                                <div className="mt-1 text-sm text-white/60">
                                                    {successData?.name}
                                                    {successData?.status === 'late' && (
                                                        <span className="ml-2 rounded-full bg-amber-500/20 px-2 py-0.5 text-xs text-amber-300">
                                                            Late
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    ) : phase === 'error' ? (
                                        <div className="flex flex-col items-center gap-4 px-6 text-center">
                                            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-rose-500/20 ring-4 ring-rose-500/30">
                                                <XCircle className="h-10 w-10 text-rose-400" />
                                            </div>
                                            <div>
                                                <div className="text-base font-bold text-rose-300">Scan Failed</div>
                                                <div className="mt-1 text-sm text-white/60">{errorMsg}</div>
                                            </div>
                                        </div>
                                    ) : (
                                        /* Idle state */
                                        <div className="flex flex-col items-center gap-4 text-center">
                                            <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-white/10">
                                                <QrCode className="h-10 w-10 text-white/60" />
                                            </div>
                                            <p className="text-sm text-white/50">
                                                Tap <strong className="text-white/80">Start Scanning</strong> then point your camera at the QR code on the admin's screen.
                                            </p>
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Scanning overlay — corner guides */}
                            {isScanning && (
                                <>
                                    <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
                                        <div className="relative h-48 w-48">
                                            <div className="absolute top-0 left-0 h-8 w-8 rounded-tl-xl border-t-4 border-l-4 border-indigo-400" />
                                            <div className="absolute top-0 right-0 h-8 w-8 rounded-tr-xl border-t-4 border-r-4 border-indigo-400" />
                                            <div className="absolute bottom-0 left-0 h-8 w-8 rounded-bl-xl border-b-4 border-l-4 border-indigo-400" />
                                            <div className="absolute right-0 bottom-0 h-8 w-8 rounded-br-xl border-b-4 border-r-4 border-indigo-400" />
                                            {/* Scan line */}
                                            <div className="absolute top-0 left-0 h-0.5 w-full animate-[scan_2s_ease-in-out_infinite] bg-indigo-400/80" />
                                        </div>
                                    </div>
                                    <div className="absolute bottom-3 left-0 right-0 text-center text-xs text-white/50">
                                        Scanning…
                                    </div>
                                </>
                            )}
                        </div>

                        {/* Controls */}
                        <div className="flex gap-3 px-4 py-4">
                            {phase === 'success' || phase === 'error' ? (
                                <button
                                    onClick={reset}
                                    className="flex-1 rounded-xl bg-indigo-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-indigo-500"
                                >
                                    {phase === 'success' ? 'Done' : 'Try Again'}
                                </button>
                            ) : (
                                <>
                                    <button
                                        onClick={() => void startCamera()}
                                        disabled={isScanning || isSubmitting || phase === 'camera-starting' || !event.scannerPortalActive}
                                        className="flex-1 rounded-xl bg-indigo-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-40"
                                    >
                                        {phase === 'camera-starting'
                                            ? 'Starting…'
                                            : isScanning
                                            ? 'Scanning…'
                                            : isSubmitting
                                            ? 'Recording…'
                                            : 'Start Scanning'}
                                    </button>
                                    {isScanning && (
                                        <button
                                            onClick={() => { stopCamera(); setPhase('idle'); }}
                                            className="rounded-xl bg-white/10 px-4 py-3 text-sm font-semibold text-white/70 transition hover:bg-white/20"
                                        >
                                            Stop
                                        </button>
                                    )}
                                </>
                            )}
                        </div>
                    </div>

                    {/* ── Instructions ───────────────────────────────────────── */}
                    <div className="rounded-2xl bg-white/5 ring-1 ring-white/10 px-5 py-4">
                        <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-white/70">
                            <Clock className="h-4 w-4" />
                            How it works
                        </div>
                        <ol className="space-y-2 text-xs text-white/40">
                            <li>1. The admin displays a QR code on their screen or projector.</li>
                            <li>2. Tap <strong className="text-white/60">Start Scanning</strong> and point your camera at it.</li>
                            <li>3. The system verifies your identity, location, and the token.</li>
                            <li>4. Your attendance is saved automatically — no manual entry needed.</li>
                        </ol>
                        <p className="mt-3 text-xs text-white/30">
                            The QR code rotates every 30 seconds — always scan the latest one.
                        </p>
                    </div>
                </div>
            </div>

            {/* Scan-line animation */}
            <style>{`
                @keyframes scan {
                    0%   { top: 0%; }
                    50%  { top: calc(100% - 2px); }
                    100% { top: 0%; }
                }
            `}</style>
        </AppShell>
    );
}
