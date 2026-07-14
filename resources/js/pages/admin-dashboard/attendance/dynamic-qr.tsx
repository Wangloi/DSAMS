import { Head, Link } from '@inertiajs/react';
import { ArrowLeft, CheckCircle2, Clock, QrCode, RefreshCw, ShieldCheck, Users, Wifi, WifiOff } from 'lucide-react';
import QRCode from 'qrcode';
import { useCallback, useEffect, useRef, useState } from 'react';
import { adminAttendance, adminAttendanceDynamicQrToken, adminAttendanceLogs } from '@/routes';
import type { BreadcrumbItem } from '@/types';
import AdminLayout from '../admin-layout';

type Props = {
    event: {
        id: number | string;
        name: string;
        location?: string | null;
        scannerPortalActive: boolean;
    };
    tokenLifetimeSeconds: number;
};

type LiveCounts = {
    total: number;
    present: number;
    late: number;
};

const breadcrumbs = (eventName: string): BreadcrumbItem[] => [
    { title: 'Admin Dashboard', href: '/admin-dashboard' },
    { title: 'Attendance', href: adminAttendance() },
    { title: `Dynamic QR — ${eventName}`, href: '#' },
];

export default function DynamicQrPage({ event, tokenLifetimeSeconds }: Props) {
    const canvasRef    = useRef<HTMLCanvasElement>(null);
    const intervalRef  = useRef<ReturnType<typeof setInterval> | null>(null);
    const countdownRef = useRef<ReturnType<typeof setInterval> | null>(null);

    const [qrDataUrl,  setQrDataUrl]  = useState<string | null>(null);
    const [token,      setToken]      = useState<string>('');
    const [expiresAt,  setExpiresAt]  = useState<Date | null>(null);
    const [remaining,  setRemaining]  = useState<number>(tokenLifetimeSeconds);
    const [loading,    setLoading]    = useState<boolean>(true);
    const [error,      setError]      = useState<string | null>(null);
    const [portalActive, setPortalActive] = useState<boolean>(event.scannerPortalActive);
    const [counts,     setCounts]     = useState<LiveCounts>({ total: 0, present: 0, late: 0 });
    const [lastRefresh, setLastRefresh] = useState<Date>(new Date());

    // ── Render QR from a JSON payload string ───────────────────────────────────
    const renderQr = useCallback(async (payload: string) => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        await QRCode.toCanvas(canvas, payload, {
            width:          380,
            margin:         2,
            color:          { dark: '#0f172a', light: '#ffffff' },
            errorCorrectionLevel: 'M',
        });
        setQrDataUrl(canvas.toDataURL());
    }, []);

    // ── Fetch a fresh token from the server ────────────────────────────────────
    const fetchToken = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const res = await fetch(adminAttendanceDynamicQrToken(event.id), {
                headers: { 'X-Requested-With': 'XMLHttpRequest', Accept: 'application/json' },
                credentials: 'include',
            });
            if (!res.ok) {
                const body = await res.json().catch(() => ({}));
                if (res.status === 409) {
                    setPortalActive(false);
                    setError('Activate the attendance session first (click "Activate Scanner Portal" on the event).');
                } else {
                    setError((body as any)?.message ?? 'Failed to generate QR token.');
                }
                setLoading(false);
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
            setError(e?.message ?? 'Network error.');
        } finally {
            setLoading(false);
        }
    }, [event.id, renderQr]);

    // ── Fetch live attendance counts ───────────────────────────────────────────
    const fetchCounts = useCallback(async () => {
        try {
            const res = await fetch(adminAttendanceLogs(event.id, 1), {
                headers: { 'X-Requested-With': 'XMLHttpRequest', Accept: 'application/json' },
                credentials: 'include',
            });
            if (res.ok) {
                const data = await res.json();
                if (data?.counts) {
                    setCounts({
                        total:   data.counts.total   ?? 0,
                        present: data.counts.present ?? 0,
                        late:    data.counts.late    ?? 0,
                    });
                }
            }
        } catch {
            // silent
        }
    }, [event.id]);

    // ── Countdown ticker ───────────────────────────────────────────────────────
    useEffect(() => {
        countdownRef.current = setInterval(() => {
            if (!expiresAt) return;
            const diff = Math.max(0, Math.ceil((expiresAt.getTime() - Date.now()) / 1000));
            setRemaining(diff);
        }, 250);
        return () => { if (countdownRef.current) clearInterval(countdownRef.current); };
    }, [expiresAt]);

    // ── Auto-refresh token every `tokenLifetimeSeconds` ───────────────────────
    useEffect(() => {
        void fetchToken();
        void fetchCounts();

        intervalRef.current = setInterval(() => {
            void fetchToken();
        }, tokenLifetimeSeconds * 1000);

        const countsInterval = setInterval(fetchCounts, 10_000);

        return () => {
            if (intervalRef.current) clearInterval(intervalRef.current);
            clearInterval(countsInterval);
        };
    }, [fetchToken, fetchCounts, tokenLifetimeSeconds]);

    const progress = remaining / tokenLifetimeSeconds; // 0 → 1
    const progressDeg = progress * 360;
    const urgency = remaining <= 5;

    return (
        <AdminLayout breadcrumbs={breadcrumbs(event.name)}>
            <Head title={`Dynamic QR — ${event.name}`} />

            <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 px-4 py-8">
                {/* ── Header ────────────────────────────────────────────────────── */}
                <div className="mx-auto max-w-5xl">
                    <div className="mb-8 flex items-center justify-between">
                        <Link
                            href={adminAttendance()}
                            className="inline-flex items-center gap-2 rounded-xl bg-white/10 px-4 py-2 text-sm font-medium text-white/80 transition hover:bg-white/20 hover:text-white"
                        >
                            <ArrowLeft className="h-4 w-4" />
                            Back to Attendance
                        </Link>

                        <div className="flex items-center gap-3">
                            {portalActive ? (
                                <span className="inline-flex items-center gap-2 rounded-full bg-emerald-500/20 px-3 py-1 text-xs font-semibold text-emerald-300 ring-1 ring-emerald-500/30">
                                    <Wifi className="h-3 w-3" />
                                    Session Active
                                </span>
                            ) : (
                                <span className="inline-flex items-center gap-2 rounded-full bg-rose-500/20 px-3 py-1 text-xs font-semibold text-rose-300 ring-1 ring-rose-500/30">
                                    <WifiOff className="h-3 w-3" />
                                    Session Inactive
                                </span>
                            )}
                        </div>
                    </div>

                    <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
                        {/* ── QR Code Panel ──────────────────────────────────────── */}
                        <div className="lg:col-span-2">
                            <div className="overflow-hidden rounded-3xl bg-white/5 ring-1 ring-white/10 backdrop-blur-sm">
                                {/* Title bar */}
                                <div className="border-b border-white/10 bg-white/5 px-6 py-4">
                                    <div className="flex items-center gap-3">
                                        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-500/20">
                                            <QrCode className="h-5 w-5 text-indigo-300" />
                                        </div>
                                        <div>
                                            <div className="text-sm font-semibold text-white">{event.name}</div>
                                            <div className="text-xs text-white/50">{event.location ?? 'No location set'}</div>
                                        </div>
                                    </div>
                                </div>

                                {/* QR display area */}
                                <div className="flex flex-col items-center gap-6 px-6 py-10">
                                    {error ? (
                                        <div className="flex flex-col items-center gap-4 text-center">
                                            <div className="flex h-24 w-24 items-center justify-center rounded-2xl bg-rose-500/10 ring-1 ring-rose-500/30">
                                                <WifiOff className="h-12 w-12 text-rose-400" />
                                            </div>
                                            <p className="max-w-sm text-sm text-rose-300">{error}</p>
                                            <button
                                                onClick={() => void fetchToken()}
                                                className="inline-flex items-center gap-2 rounded-xl bg-white/10 px-4 py-2 text-sm font-medium text-white transition hover:bg-white/20"
                                            >
                                                <RefreshCw className="h-4 w-4" />
                                                Retry
                                            </button>
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
                                                        stroke="rgba(255,255,255,0.08)"
                                                        strokeWidth="6"
                                                    />
                                                    <circle
                                                        cx="220" cy="220" r="210"
                                                        fill="none"
                                                        stroke={urgency ? '#f87171' : '#6366f1'}
                                                        strokeWidth="6"
                                                        strokeLinecap="round"
                                                        strokeDasharray={`${2 * Math.PI * 210 * progress} ${2 * Math.PI * 210}`}
                                                        className="transition-all duration-300"
                                                    />
                                                </svg>

                                                {/* QR canvas */}
                                                <div className={`overflow-hidden rounded-2xl bg-white p-4 shadow-2xl transition-opacity duration-300 ${loading ? 'opacity-40' : 'opacity-100'}`}>
                                                    <canvas ref={canvasRef} width={380} height={380} />
                                                </div>

                                                {loading && (
                                                    <div className="absolute inset-0 flex items-center justify-center">
                                                        <RefreshCw className="h-12 w-12 animate-spin text-white/60" />
                                                    </div>
                                                )}
                                            </div>

                                            {/* Countdown label */}
                                            <div className={`flex items-center gap-2 text-sm font-semibold transition-colors ${urgency ? 'text-red-400' : 'text-white/70'}`}>
                                                <Clock className="h-4 w-4" />
                                                {remaining > 0
                                                    ? `Refreshing in ${remaining}s`
                                                    : <span className="animate-pulse">Refreshing…</span>
                                                }
                                            </div>

                                            {/* Token preview */}
                                            {token && (
                                                <div className="flex items-center gap-2 rounded-xl bg-white/5 px-4 py-2 font-mono text-xs text-white/40 ring-1 ring-white/10">
                                                    <ShieldCheck className="h-3.5 w-3.5 text-indigo-400" />
                                                    Token: {token}
                                                </div>
                                            )}

                                            <p className="max-w-sm text-center text-xs text-white/40">
                                                Show this QR code on your screen or projector. Students scan it using their DSAMS app to check in. It auto-rotates every {tokenLifetimeSeconds} seconds.
                                            </p>
                                        </>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* ── Stats + Info Panel ──────────────────────────────────── */}
                        <div className="flex flex-col gap-4">
                            {/* Live counts */}
                            <div className="rounded-2xl bg-white/5 ring-1 ring-white/10 p-5">
                                <div className="mb-4 flex items-center gap-2 text-sm font-semibold text-white/70">
                                    <Users className="h-4 w-4" />
                                    Live Attendance
                                </div>
                                <div className="grid grid-cols-1 gap-3">
                                    <div className="flex items-center justify-between rounded-xl bg-white/5 px-4 py-3">
                                        <span className="text-xs font-medium text-white/50">Total Checked In</span>
                                        <span className="text-2xl font-bold text-white">{counts.total}</span>
                                    </div>
                                    <div className="flex items-center justify-between rounded-xl bg-emerald-500/10 px-4 py-3">
                                        <span className="text-xs font-medium text-emerald-300">Present</span>
                                        <span className="text-2xl font-bold text-emerald-300">{counts.present}</span>
                                    </div>
                                    <div className="flex items-center justify-between rounded-xl bg-amber-500/10 px-4 py-3">
                                        <span className="text-xs font-medium text-amber-300">Late</span>
                                        <span className="text-2xl font-bold text-amber-300">{counts.late}</span>
                                    </div>
                                </div>
                                <p className="mt-3 text-right text-xs text-white/30">
                                    Updated every 10s
                                </p>
                            </div>

                            {/* Security info */}
                            <div className="rounded-2xl bg-white/5 ring-1 ring-white/10 p-5">
                                <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-white/70">
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
                                        <li key={item} className="flex items-center gap-2 text-xs text-white/50">
                                            <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-emerald-400" />
                                            {item}
                                        </li>
                                    ))}
                                </ul>
                            </div>

                            {/* How students scan */}
                            <div className="rounded-2xl bg-indigo-500/10 ring-1 ring-indigo-500/20 p-5">
                                <div className="mb-3 text-sm font-semibold text-indigo-300">How Students Scan</div>
                                <ol className="space-y-2 text-xs text-indigo-200/70">
                                    <li>1. Open DSAMS on their device</li>
                                    <li>2. Go to their Dashboard</li>
                                    <li>3. Tap <strong className="text-indigo-200">Scan Attendance QR</strong> for this event</li>
                                    <li>4. Point camera at this QR code</li>
                                    <li>5. Attendance is instantly recorded ✓</li>
                                </ol>
                            </div>

                            {/* Last refreshed */}
                            <div className="rounded-2xl bg-white/5 ring-1 ring-white/10 px-4 py-3 text-xs text-white/30">
                                Last token generated: {lastRefresh.toLocaleTimeString()}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </AdminLayout>
    );
}
