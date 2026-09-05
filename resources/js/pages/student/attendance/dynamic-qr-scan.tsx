import { AppShell } from '@/components/app-shell';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { studentAttendanceDynamicQrScan, studentDashboard } from '@/routes';
import { Head, Link } from '@inertiajs/react';
import { BrowserQRCodeReader } from '@zxing/browser';
import axios from 'axios';
import {
    ArrowLeft,
    Camera,
    CheckCircle2,
    Clock,
    Compass,
    Loader2,
    MapPin,
    QrCode,
    RefreshCw,
    ShieldAlert,
    ShieldCheck,
    SwitchCamera,
    Volume2,
    XCircle,
} from 'lucide-react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Swal from 'sweetalert2';
import {
    playScanSuccessSound,
    playScanErrorSound,
    playScanLateSound,
} from '@/services/notification-sound';

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

type GeoResult = {
    latitude: number;
    longitude: number;
    accuracy_m: number;
} | null;

// ── GPS helper ────────────────────────────────────────────────────────────────

const getGeo = (): Promise<GeoResult> =>
    new Promise((resolve) => {
        if (!('geolocation' in navigator)) return resolve(null);
        navigator.geolocation.getCurrentPosition(
            (pos) =>
                resolve({
                    latitude: pos.coords.latitude,
                    longitude: pos.coords.longitude,
                    accuracy_m: pos.coords.accuracy,
                }),
            () => resolve(null),
            { enableHighAccuracy: true, timeout: 10_000, maximumAge: 0 },
        );
    });

// ── Component ─────────────────────────────────────────────────────────────────

export default function StudentDynamicQrScanPage({ event }: Props) {
    const videoRef = useRef<HTMLVideoElement | null>(null);
    const streamRef = useRef<MediaStream | null>(null);
    const zxingRef = useRef<{ stop: () => void } | null>(null);
    const barcodeIntervalRef = useRef<number | null>(null);
    const lastTokenRef = useRef<{ value: string; at: number } | null>(null);

    const [phase, setPhase] = useState<ScanPhase>('idle');
    const [errorMsg, setErrorMsg] = useState<string>('');
    const [geo, setGeo] = useState<GeoResult>(null);
    const [geoStatus, setGeoStatus] = useState<'pending' | 'ok' | 'missing'>(
        'pending',
    );
    const [cameraFacing, setCameraFacing] = useState<'environment' | 'user'>('environment');
    const [successData, setSuccessData] = useState<{
        name: string;
        status: string;
    } | null>(null);

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
            const now = Date.now();
            if (
                lastTokenRef.current?.value === rawQrPayload &&
                now - lastTokenRef.current.at < 2_000
            )
                return;
            lastTokenRef.current = { value: rawQrPayload, at: now };

            let token: string | null = null;
            let qrEventId: number | null = null;
            try {
                const parsed = JSON.parse(rawQrPayload);
                if (parsed?.type === 'dsams-attendance-token') {
                    token = String(parsed.token ?? '');
                    qrEventId = Number(parsed.event_id ?? 0);
                }
            } catch {
                // not JSON — ignore
            }

            if (!token) return;

            if (qrEventId !== null && qrEventId !== Number(event.id)) {
                void Swal.fire({
                    icon: 'error',
                    title: 'Wrong Event Code',
                    text: 'This QR code belongs to a different event session.',
                    confirmButtonColor: '#0b2d66',
                });
                return;
            }

            stopCamera();
            setPhase('submitting');

            const freshGeo = (await getGeo()) ?? geo;

            try {
                const body: Record<string, unknown> = { token };
                if (freshGeo) {
                    body.latitude = freshGeo.latitude;
                    body.longitude = freshGeo.longitude;
                    body.accuracy_m = freshGeo.accuracy_m;
                }

                const res = await axios.post(
                    studentAttendanceDynamicQrScan(event.id),
                    body,
                    {
                        headers: {
                            Accept: 'application/json',
                            'Content-Type': 'application/json',
                        },
                    },
                );

                const data = res.data ?? {};
                const scanStatus = String(data?.status ?? 'present');
                if (scanStatus === 'late') {
                    playScanLateSound();
                } else {
                    playScanSuccessSound();
                }

                setSuccessData({
                    name: String(data?.student?.name ?? 'You'),
                    status: scanStatus,
                });
                setPhase('success');
            } catch (e: any) {
                const status = e?.response?.status;
                const data = e?.response?.data ?? {};

                if (status === 409) {
                    playScanSuccessSound();
                    setSuccessData({
                        name: 'You',
                        status: 'already-checked-in',
                    });
                    setPhase('success');
                } else {
                    playScanErrorSound();
                    const message = String(
                        data?.message ??
                            e?.message ??
                            'Something went wrong. Please try again.',
                    );
                    setErrorMsg(message);
                    setPhase('error');
                }
            }
        },
        [event.id, geo, stopCamera],
    );

    // ── Start camera ──────────────────────────────────────────────────────────
    const startCamera = useCallback(async () => {
        if (!event.scannerPortalActive) {
            setErrorMsg(
                'The attendance session is not active yet. Please wait for the event coordinator to activate it.',
            );
            setPhase('error');
            return;
        }

        setPhase('camera-starting');
        setErrorMsg('');
        setSuccessData(null);

        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                video: { facingMode: { ideal: cameraFacing } },
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
                }) => {
                    detect: (
                        src: CanvasImageSource,
                    ) => Promise<{ rawValue?: string }[]>;
                };
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
                }, 220);
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
                zxingRef.current = {
                    stop: () => {
                        try {
                            controls.stop();
                        } catch {
                            /**/
                        }
                    },
                };
            }
        } catch (e: any) {
            stopCamera();
            setErrorMsg(
                e?.message ??
                    'Unable to access camera. Please allow camera permissions in your browser.',
            );
            setPhase('error');
        }
    }, [
        event.scannerPortalActive,
        cameraFacing,
        barcodeApiSupported,
        submitToken,
        stopCamera,
    ]);

    const toggleCameraFacing = () => {
        setCameraFacing((prev) => (prev === 'environment' ? 'user' : 'environment'));
    };

    const reset = () => {
        stopCamera();
        setPhase('idle');
        setErrorMsg('');
        setSuccessData(null);
        lastTokenRef.current = null;
    };

    const isScanning = phase === 'scanning';
    const isSubmitting = phase === 'submitting';

    return (
        <AppShell>
            <Head title={`Scan Attendance — ${event.name}`} />

            <div className="relative min-h-screen overflow-x-hidden bg-slate-950 font-sans text-slate-100 selection:bg-blue-600 selection:text-white pb-16">
                {/* Background ambient lighting */}
                <div className="pointer-events-none fixed inset-0 z-0">
                    <div className="absolute inset-0 bg-[linear-gradient(to_right,#1e293b12_1px,transparent_1px),linear-gradient(to_bottom,#1e293b12_1px,transparent_1px)] bg-[size:32px_32px]" />
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 h-[450px] w-[450px] rounded-full bg-blue-600/10 blur-[130px]" />
                    <div className="absolute bottom-0 right-10 h-[350px] w-[350px] rounded-full bg-indigo-600/10 blur-[130px]" />
                </div>

                <div className="relative z-10 mx-auto flex w-full max-w-xl flex-col gap-6 px-4 py-8 sm:px-6">
                    {/* Header Banner */}
                    <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-r from-[#07193b] via-[#0d285b] to-[#153f8a] p-6 shadow-2xl backdrop-blur-2xl">
                        <div className="flex items-center justify-between gap-3 mb-4">
                            <Button
                                type="button"
                                variant="ghost"
                                className="h-8 gap-2 rounded-xl border border-white/15 bg-white/10 px-3 text-xs font-bold text-white backdrop-blur-md transition-all hover:bg-white/20 hover:text-white"
                                asChild
                            >
                                <Link href={studentDashboard()}>
                                    <ArrowLeft className="h-3.5 w-3.5" />
                                    Dashboard
                                </Link>
                            </Button>

                            <div className="inline-flex items-center gap-2 rounded-full border border-blue-400/30 bg-blue-500/15 px-3 py-1 text-[10px] font-black tracking-wider text-blue-200 uppercase backdrop-blur-md">
                                <span className="relative flex h-2 w-2">
                                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                                    <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-400" />
                                </span>
                                <span>Self Check-In</span>
                            </div>
                        </div>

                        <h1 className="text-xl font-black text-white sm:text-2xl drop-shadow-md">
                            Scan Event Attendance QR
                        </h1>
                        <p className="mt-1 text-xs font-semibold text-blue-200/90">
                            {event.name}
                        </p>
                        {event.date && (
                            <p className="mt-0.5 text-[11px] font-medium text-blue-300/70">
                                {event.date} {event.location ? `• ${event.location}` : ''}
                            </p>
                        )}
                    </div>

                    {/* GPS Status Indicator */}
                    <div
                        className={`flex items-center gap-3 rounded-2xl p-3.5 text-xs font-bold backdrop-blur-xl border ${
                            geoStatus === 'ok'
                                ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300'
                                : geoStatus === 'missing'
                                  ? 'border-amber-500/30 bg-amber-500/10 text-amber-300'
                                  : 'border-white/10 bg-slate-900/60 text-slate-400'
                        }`}
                    >
                        <Compass className="h-4 w-4 shrink-0 text-cyan-400" />
                        <span>
                            {geoStatus === 'ok'
                                ? `GPS Verified (Accuracy: ±${Math.round(geo!.accuracy_m)}m)`
                                : geoStatus === 'missing'
                                  ? event.geofenceEnabled
                                      ? 'GPS Location unavailable — attendance requires active location permissions.'
                                      : 'GPS Location unavailable (not enforced for this event).'
                                  : 'Acquiring GPS coordinates…'}
                        </span>
                    </div>

                    {/* Scanner Portal Deactivated Warning */}
                    {!event.scannerPortalActive && (
                        <div className="flex items-center gap-3 rounded-2xl border border-rose-500/30 bg-rose-500/10 p-4 text-xs font-bold text-rose-300 backdrop-blur-xl">
                            <ShieldAlert className="h-4 w-4 shrink-0 text-rose-400" />
                            <span>
                                The attendance scanning session is currently paused. Please wait for the event coordinator.
                            </span>
                        </div>
                    )}

                    {/* Camera Scanner Viewport Card */}
                    <div className="overflow-hidden rounded-3xl border border-white/10 bg-slate-900/80 shadow-2xl backdrop-blur-xl">
                        <div className="relative aspect-[4/3] w-full overflow-hidden bg-black">
                            <video
                                ref={videoRef}
                                className="absolute inset-0 h-full w-full object-cover"
                                playsInline
                                muted
                            />

                            {/* Camera HUD Reticle */}
                            {isScanning && (
                                <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
                                    <div className="relative h-56 w-56 sm:h-64 sm:w-64">
                                        <div className="absolute top-0 left-0 h-8 w-8 rounded-tl-2xl border-t-4 border-l-4 border-cyan-400 shadow-[0_0_10px_rgba(34,211,238,0.8)]" />
                                        <div className="absolute top-0 right-0 h-8 w-8 rounded-tr-2xl border-t-4 border-r-4 border-cyan-400 shadow-[0_0_10px_rgba(34,211,238,0.8)]" />
                                        <div className="absolute bottom-0 left-0 h-8 w-8 rounded-bl-2xl border-b-4 border-l-4 border-cyan-400 shadow-[0_0_10px_rgba(34,211,238,0.8)]" />
                                        <div className="absolute right-0 bottom-0 h-8 w-8 rounded-br-2xl border-r-4 border-b-4 border-cyan-400 shadow-[0_0_10px_rgba(34,211,238,0.8)]" />
                                        <div className="absolute top-0 left-0 h-1 w-full animate-scan-line bg-gradient-to-r from-transparent via-cyan-400 to-transparent shadow-[0_0_15px_rgba(34,211,238,1)]" />
                                    </div>
                                </div>
                            )}

                            {/* Overlays for different phases */}
                            {!isScanning && (
                                <div className="absolute inset-0 flex items-center justify-center bg-slate-950/85 p-6 backdrop-blur-md">
                                    {phase === 'camera-starting' ? (
                                        <div className="flex flex-col items-center gap-3 text-white">
                                            <Loader2 className="h-10 w-10 animate-spin text-blue-400" />
                                            <span className="text-xs font-bold tracking-wider uppercase text-slate-300">
                                                Starting Camera…
                                            </span>
                                        </div>
                                    ) : phase === 'submitting' ? (
                                        <div className="flex flex-col items-center gap-3 text-white">
                                            <Loader2 className="h-10 w-10 animate-spin text-emerald-400" />
                                            <span className="text-xs font-bold tracking-wider uppercase text-slate-300">
                                                Verifying Attendance…
                                            </span>
                                        </div>
                                    ) : phase === 'success' ? (
                                        <div className="flex flex-col items-center gap-4 text-center animate-in zoom-in-95">
                                            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-500/20 text-emerald-400 ring-2 ring-emerald-400/40 shadow-lg shadow-emerald-500/20">
                                                <CheckCircle2 className="h-8 w-8" />
                                            </div>
                                            <div>
                                                <h3 className="text-base font-black text-white uppercase tracking-wider">
                                                    {successData?.status === 'already-checked-in'
                                                        ? 'Already Checked In'
                                                        : 'Attendance Recorded!'}
                                                </h3>
                                                <p className="mt-1 text-xs font-semibold text-emerald-300">
                                                    {successData?.name} {successData?.status === 'late' && '(Late Arrival)'}
                                                </p>
                                            </div>
                                        </div>
                                    ) : phase === 'error' ? (
                                        <div className="flex flex-col items-center gap-4 text-center animate-in zoom-in-95">
                                            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-rose-500/20 text-rose-400 ring-2 ring-rose-400/40 shadow-lg shadow-rose-500/20">
                                                <XCircle className="h-8 w-8" />
                                            </div>
                                            <div>
                                                <h3 className="text-base font-black text-rose-300 uppercase tracking-wider">
                                                    Scan Unsuccessful
                                                </h3>
                                                <p className="mt-1 text-xs font-medium text-slate-300 max-w-xs">
                                                    {errorMsg}
                                                </p>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="flex flex-col items-center gap-3 text-center">
                                            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-500/15 text-blue-400 ring-1 ring-blue-500/30">
                                                <QrCode className="h-8 w-8" />
                                            </div>
                                            <p className="text-xs font-semibold text-slate-300 max-w-xs leading-relaxed">
                                                Tap <strong className="text-white">Start Camera Scan</strong> and align the dynamic QR display into view.
                                            </p>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>

                        {/* Scanner Actions Bar */}
                        <div className="flex flex-wrap items-center justify-between gap-3 p-5 border-t border-white/10 bg-slate-950/60">
                            {phase === 'success' || phase === 'error' ? (
                                <Button
                                    type="button"
                                    onClick={reset}
                                    className="w-full h-11 rounded-xl bg-blue-600 font-bold text-white hover:bg-blue-500 active:scale-95"
                                >
                                    {phase === 'success' ? 'Scan Another' : 'Try Again'}
                                </Button>
                            ) : (
                                <>
                                    <Button
                                        type="button"
                                        onClick={() => void startCamera()}
                                        disabled={isScanning || isSubmitting || phase === 'camera-starting' || !event.scannerPortalActive}
                                        className="flex-1 h-11 rounded-xl bg-blue-600 font-bold text-white hover:bg-blue-500 active:scale-95 shadow-lg shadow-blue-600/20"
                                    >
                                        <Camera className="h-4 w-4 mr-2" />
                                        {phase === 'camera-starting' ? 'Starting…' : isScanning ? 'Scanning Active…' : 'Start Camera Scan'}
                                    </Button>

                                    {isScanning && (
                                        <>
                                            <Button
                                                type="button"
                                                variant="outline"
                                                onClick={toggleCameraFacing}
                                                className="h-11 rounded-xl border-white/10 bg-white/5 text-xs text-slate-300 hover:bg-white/10 hover:text-white"
                                            >
                                                <SwitchCamera className="h-4 w-4" />
                                            </Button>
                                            <Button
                                                type="button"
                                                variant="outline"
                                                onClick={() => {
                                                    stopCamera();
                                                    setPhase('idle');
                                                }}
                                                className="h-11 rounded-xl border-white/10 bg-white/5 text-xs font-bold text-slate-300 hover:bg-white/10 hover:text-white"
                                            >
                                                Stop
                                            </Button>
                                        </>
                                    )}
                                </>
                            )}
                        </div>
                    </div>

                    {/* How It Works Card */}
                    <div className="rounded-3xl border border-white/10 bg-slate-900/60 p-5 shadow-xl backdrop-blur-xl">
                        <div className="flex items-center gap-2 pb-3 border-b border-white/10 text-xs font-black text-white uppercase tracking-wider">
                            <Clock className="h-4 w-4 text-blue-400" />
                            <span>Quick Instructions</span>
                        </div>
                        <ol className="mt-3 space-y-2 text-xs font-medium text-slate-400">
                            <li>1. Look at the rotating QR display presented by the event coordinator.</li>
                            <li>2. Tap <strong className="text-white">Start Camera Scan</strong> and point your device camera at the code.</li>
                            <li>3. Your location and token will be authenticated automatically with instant feedback.</li>
                        </ol>
                    </div>
                </div>
            </div>
        </AppShell>
    );
}
