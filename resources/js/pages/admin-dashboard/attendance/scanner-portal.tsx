import { Head, Link } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import { 
    CheckCircle2, 
    Eye, 
    QrCode, 
    ArrowLeft, 
    Clock, 
    RefreshCw, 
    ShieldCheck, 
    Users, 
    Wifi, 
    WifiOff
} from 'lucide-react';
import QRCode from 'qrcode';
import { useCallback, useEffect, useRef, useState } from 'react';
import { adminAttendance, adminDashboard, adminAttendanceDynamicQrToken, adminAttendanceLogs } from '@/routes';
import type { BreadcrumbItem } from '@/types';
import AdminLayout from '../admin-layout';

type Props = {
    event: {
        id: number | string;
        name: string;
        date?: string | null;
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

export default function AdminAttendanceScannerPortalPage({ event, tokenLifetimeSeconds }: Props) {
    const breadcrumbs: BreadcrumbItem[] = [
        {
            title: 'Admin Dashboard',
            href: adminDashboard(),
        },
        {
            title: 'Attendance',
            href: adminAttendance(),
        },
        {
            title: 'Attendance Scanner Portal',
            href: adminAttendance(),
        },
    ];

    // ─── Dynamic QR mode state ──────────────────────────────────────────────────
    const qrCanvasRef = useRef<HTMLCanvasElement | null>(null);
    const qrIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
    const qrCountdownRef = useRef<ReturnType<typeof setInterval> | null>(null);

    const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);
    const [token, setToken] = useState<string>('');
    const [expiresAt, setExpiresAt] = useState<Date | null>(null);
    const [remaining, setRemaining] = useState<number>(tokenLifetimeSeconds);
    const [qrLoading, setQrLoading] = useState<boolean>(true);
    const [qrError, setQrError] = useState<string | null>(null);
    const [portalActive, setPortalActive] = useState<boolean>(event.scannerPortalActive);
    const [counts, setCounts] = useState<LiveCounts>({ total: 0, present: 0, late: 0 });
    const [lastRefresh, setLastRefresh] = useState<Date>(new Date());

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
        setQrLoading(true);
        setQrError(null);
        try {
            const res = await fetch(adminAttendanceDynamicQrToken(event.id), {
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
    }, [event.id, renderQr]);

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
                        total: data.counts.total ?? 0,
                        present: data.counts.present ?? 0,
                        late: data.counts.late ?? 0,
                    });
                }
            }
        } catch {
            // silent
        }
    }, [event.id]);

    // ─── Dynamic QR effects ──────────────────────────────────────────────────────
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
        void fetchToken();
        void fetchCounts();

        qrIntervalRef.current = setInterval(() => {
            void fetchToken();
        }, tokenLifetimeSeconds * 1000);

        const countsInterval = setInterval(fetchCounts, 10000);

        return () => {
            if (qrIntervalRef.current) clearInterval(qrIntervalRef.current);
            clearInterval(countsInterval);
        };
    }, [fetchToken, fetchCounts, tokenLifetimeSeconds]);

    return (
        <AdminLayout breadcrumbs={breadcrumbs}>
            <Head title="Attendance Scanner Portal" />

            <div className="min-h-[calc(100vh-4rem)] bg-slate-50/50 dark:bg-slate-900">
                <div className="flex w-full flex-col gap-6 px-6 py-8">
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
                                <QrCode className="h-6 w-6" />
                            </div>
                            <div>
                                <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
                                    {event.name}
                                </h1>
                                <p className="text-sm text-slate-500 dark:text-slate-400">
                                    Dynamic QR code for student self check-in
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

                    <div className="grid grid-cols-1 gap-6 lg:grid-cols-3 mx-auto max-w-5xl w-full">
                        {/* ── QR Code Panel ──────────────────────────────────────── */}
                        <div className="lg:col-span-2">
                            <div className="overflow-hidden rounded-3xl bg-white dark:bg-[#0B192C]/80 border border-slate-200 dark:border-slate-800 shadow-xl">
                                {/* Title bar */}
                                <div className="border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 px-6 py-4">
                                    <div className="flex items-center gap-3">
                                        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-600/10 dark:bg-blue-600/20">
                                            <QrCode className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                                        </div>
                                        <div>
                                            <div className="text-sm font-semibold text-slate-900 dark:text-white">{event.name}</div>
                                            <div className="text-xs text-slate-500 dark:text-slate-400">{event.location ?? 'No location set'}</div>
                                        </div>
                                    </div>
                                </div>

                                {/* QR display area */}
                                <div className="flex flex-col items-center gap-6 px-6 py-10">
                                    {qrError ? (
                                        <div className="flex flex-col items-center gap-4 text-center">
                                            <div className="flex h-24 w-24 items-center justify-center rounded-2xl bg-rose-50 dark:bg-rose-500/10 ring-1 ring-rose-200 dark:ring-rose-500/30">
                                                <WifiOff className="h-12 w-12 text-rose-600 dark:text-rose-400" />
                                            </div>
                                            <p className="max-w-sm text-sm text-rose-700 dark:text-rose-300">{qrError}</p>
                                            <button
                                                onClick={() => void fetchToken()}
                                                className="inline-flex items-center gap-2 rounded-xl bg-slate-100 dark:bg-white/10 px-4 py-2 text-sm font-medium text-slate-900 dark:text-white transition hover:bg-slate-200 dark:hover:bg-white/20"
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
                                            <div className={`flex items-center gap-2 text-sm font-semibold transition-colors ${remaining <= 5 ? 'text-red-500' : 'text-slate-500'}`}>
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

                        {/* ── Stats + Info Panel ──────────────────────────────────── */}
                        <div className="flex flex-col gap-4">
                            {/* Live counts */}
                            <div className="rounded-2xl bg-white dark:bg-[#0B192C]/80 border border-slate-200 dark:border-slate-800 shadow-xl p-5">
                                <div className="mb-4 flex items-center gap-2 text-sm font-semibold text-slate-900 dark:text-white/70">
                                    <Users className="h-4 w-4" />
                                    Live Attendance
                                </div>
                                <div className="grid grid-cols-1 gap-3">
                                    <div className="flex items-center justify-between rounded-xl bg-slate-50 dark:bg-white/5 px-4 py-3">
                                        <span className="text-xs font-medium text-slate-500 dark:text-white/50">Total Checked In</span>
                                        <span className="text-2xl font-bold text-slate-900 dark:text-white">{counts.total}</span>
                                    </div>
                                    <div className="flex items-center justify-between rounded-xl bg-emerald-50 dark:bg-emerald-500/10 px-4 py-3">
                                        <span className="text-xs font-medium text-emerald-700 dark:text-emerald-300">Present</span>
                                        <span className="text-2xl font-bold text-emerald-700 dark:text-emerald-300">{counts.present}</span>
                                    </div>
                                    <div className="flex items-center justify-between rounded-xl bg-amber-50 dark:bg-amber-500/10 px-4 py-3">
                                        <span className="text-xs font-medium text-amber-700 dark:text-amber-300">Late</span>
                                        <span className="text-2xl font-bold text-amber-700 dark:text-amber-300">{counts.late}</span>
                                    </div>
                                </div>
                                <p className="mt-3 text-right text-xs text-slate-400 dark:text-white/30">
                                    Updated every 10s
                                </p>
                            </div>

                            {/* Security info */}
                            <div className="rounded-2xl bg-white dark:bg-[#0B192C]/80 border border-slate-200 dark:border-slate-800 shadow-xl p-5">
                                <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-slate-900 dark:text-white/70">
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
                                <div className="mb-3 text-sm font-semibold text-blue-700 dark:text-indigo-300">How Students Scan</div>
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
                </div>
            </div>
        </AdminLayout>
    );
}
