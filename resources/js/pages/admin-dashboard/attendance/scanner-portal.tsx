import { Head } from '@inertiajs/react';
import { BrowserQRCodeReader } from '@zxing/browser';
import { CheckCircle2, Eye, FileDown, Printer, QrCode, XCircle } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { adminAttendance, adminDashboard } from '@/routes';
import type { BreadcrumbItem } from '@/types';
import AdminLayout from '../admin-layout';

type Props = {
    event: {
        id: number | string;
        name: string;
        date?: string | null;
        location?: string | null;
    };
};

type AttendanceLogRow = {
    id: string;
    name: string;
    program: string;
    time: string;
    status: 'valid' | 'invalid';
};

type ScanState =
    | { status: 'idle' }
    | { status: 'starting' }
    | { status: 'running' }
    | { status: 'error'; message: string }
    | { status: 'unsupported'; message: string };

const attendanceLogRows: AttendanceLogRow[] = [
    { id: '2023-001', name: 'Juan Dela Cruz', program: 'BSIT', time: '8:11 AM', status: 'valid' },
    { id: '2023-014', name: 'Maria Santos', program: 'BSED', time: '8:10 AM', status: 'valid' },
    { id: '2023-085', name: 'Mark Reyes', program: 'BSBA', time: '8:05 AM', status: 'valid' },
    { id: '2023-108', name: 'Ana Dizon', program: 'BSIT', time: '8:20 AM', status: 'valid' },
    { id: '2023-208', name: 'John Lozano', program: 'BSIT', time: '8:30 AM', status: 'valid' },
    { id: '2023-205', name: 'Carla Lopez', program: 'BSHM', time: '8:35 AM', status: 'valid' },
    { id: '2023-311', name: 'Brian Cruz', program: 'BSIT', time: '8:42 AM', status: 'invalid' },
    { id: '2023-402', name: 'Mika Santos', program: 'BSBA', time: '8:47 AM', status: 'valid' },
    { id: '2023-512', name: 'Paolo Reyes', program: 'BSIT', time: '8:50 AM', status: 'valid' },
    { id: '2023-633', name: 'Nina Cruz', program: 'BSED', time: '8:54 AM', status: 'valid' },
    { id: '2023-701', name: 'Kim Santos', program: 'BSHM', time: '8:56 AM', status: 'valid' },
    { id: '2023-748', name: 'Ralph Dela Cruz', program: 'BSIT', time: '8:58 AM', status: 'valid' },
];

export default function AdminAttendanceScannerPortalPage({ event }: Props) {
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

    const videoRef = useRef<HTMLVideoElement | null>(null);
    const streamRef = useRef<MediaStream | null>(null);
    const intervalRef = useRef<number | null>(null);
    const zxingRef = useRef<{ reader: BrowserQRCodeReader; stop: () => void } | null>(null);
    const lastValueRef = useRef<{ value: string; at: number } | null>(null);

    const [pageIndex, setPageIndex] = useState(1);
    const pageSize = 6;

    const [scanState, setScanState] = useState<ScanState>({ status: 'idle' });
    const [logRows, setLogRows] = useState<AttendanceLogRow[]>(attendanceLogRows);
    const [lastScanned, setLastScanned] = useState<AttendanceLogRow | null>(attendanceLogRows[0] ?? null);

    const barcodeDetectorSupported = useMemo(() => {
        return typeof window !== 'undefined' && 'BarcodeDetector' in window;
    }, []);

    const totalPages = Math.max(1, Math.ceil(logRows.length / pageSize));
    const startIndex = (pageIndex - 1) * pageSize;
    const pagedRows = useMemo(() => {
        return logRows.slice(startIndex, startIndex + pageSize);
    }, [logRows, startIndex]);

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

    const handleDecodedValue = (rawValue: string) => {
        const value = String(rawValue ?? '').trim();
        if (!value) return;

        const now = Date.now();
        if (lastValueRef.current?.value === value && now - lastValueRef.current.at < 1500) return;
        lastValueRef.current = { value, at: now };

        const time = new Date().toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
        const next: AttendanceLogRow = {
            id: value,
            name: value,
            program: '—',
            time,
            status: 'valid',
        };

        setLastScanned(next);
        setLogRows((prev) => [next, ...prev]);
        setPageIndex(1);
    };

    const start = async () => {
        setScanState({ status: 'starting' });

        try {
            const video = videoRef.current;
            if (!video) {
                setScanState({ status: 'error', message: 'Video element not available.' });
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
                const Detector = (window as any).BarcodeDetector as new (options: { formats: string[] }) => {
                    detect: (source: CanvasImageSource) => Promise<Array<{ rawValue?: string }>>;
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
                const controls = await reader.decodeFromVideoDevice(undefined, video, (result) => {
                    const value = result?.getText?.() ?? '';
                    if (value) handleDecodedValue(value);
                });

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
            stop();
            setScanState({ status: 'error', message: e?.message ?? 'Unable to access camera.' });
        }
    };

    useEffect(() => {
        void start();
        return () => stop();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    return (
        <AdminLayout breadcrumbs={breadcrumbs}>
            <Head title="Attendance Scanner Portal" />

            <div className="min-h-[calc(100vh-4rem)] bg-slate-100">
                <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-5 py-6">
                    <div className="rounded-2xl bg-gradient-to-r from-[#0b2d66] to-[#1e40af] px-7 py-6 text-white shadow-sm">
                        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                            <div className="leading-tight">
                                <div className="text-lg font-semibold">Attendance Scanner Portal - Leadership Seminar</div>
                                <div className="mt-1 text-sm text-white/80">Feb 10, 2025</div>
                            </div>
                            <Button className="gap-2 bg-white/15 text-white hover:bg-white/25 transition-colors">
                                <Eye className="h-4 w-4" />
                                View Attendance
                            </Button>
                        </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-3 rounded-xl border border-slate-200 bg-white px-5 py-4 shadow-sm">
                        <div className="text-sm font-semibold text-slate-700">Scanner Status:</div>
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
                                className="h-9 bg-emerald-600 text-white hover:bg-emerald-700"
                                onClick={start}
                                disabled={scanState.status === 'starting' || scanState.status === 'running'}
                            >
                                Start
                            </Button>
                            <Button type="button" size="sm" variant="outline" className="h-9" onClick={stop}>
                                Stop
                            </Button>
                        </div>
                    </div>

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
                                            {scanState.status !== 'running' && (
                                                <div className="absolute inset-0 grid place-items-center">
                                                    <div className="grid h-16 w-16 place-items-center rounded-2xl bg-white/10 text-white">
                                                        <QrCode className="h-8 w-8" />
                                                    </div>
                                                </div>
                                            )}
                                            <div className="absolute left-4 top-4 h-10 w-10 rounded-lg border-2 border-white/70" />
                                            <div className="absolute right-4 top-4 h-10 w-10 rounded-lg border-2 border-white/70" />
                                            <div className="absolute bottom-4 left-4 h-10 w-10 rounded-lg border-2 border-white/70" />
                                            <div className="absolute bottom-4 right-4 h-10 w-10 rounded-lg border-2 border-white/70" />
                                        </div>
                                        {lastScanned ? (
                                            <div
                                                className={
                                                    'px-6 py-3 text-center text-sm font-semibold text-white ' +
                                                    (lastScanned.status === 'valid' ? 'bg-emerald-700/90' : 'bg-rose-700/90')
                                                }
                                            >
                                                {lastScanned.status === 'valid' ? 'Valid' : 'Invalid'} - {lastScanned.name}
                                            </div>
                                        ) : (
                                            <div className="bg-slate-900/60 px-6 py-3 text-center text-sm font-semibold text-white">
                                                Scan a QR code to begin
                                            </div>
                                        )}
                                    </div>

                                    {scanState.status === 'error' && (
                                        <div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                                            {scanState.message}
                                        </div>
                                    )}

                                    <div className="flex flex-wrap items-center gap-2">
                                        <Button variant="outline" className="h-9 border-slate-200 bg-white text-slate-700">
                                            <Printer className="mr-2 h-4 w-4" />
                                            Print Attendance
                                        </Button>
                                        <Button variant="outline" className="h-9 border-slate-200 bg-white text-slate-700">
                                            <FileDown className="mr-2 h-4 w-4" />
                                            Export CSV
                                        </Button>
                                    </div>

                                    <div className="rounded-xl border border-slate-200 bg-white">
                                        <div className="border-b border-slate-200 px-5 py-3">
                                            <div className="text-sm font-semibold text-slate-800">Attendance Log</div>
                                        </div>
                                        <div className="overflow-x-auto">
                                            <table className="w-full text-left text-sm">
                                                <thead className="bg-slate-50 text-slate-700">
                                                    <tr>
                                                        <th className="px-5 py-3 font-medium">Student ID</th>
                                                        <th className="px-5 py-3 font-medium">Name</th>
                                                        <th className="px-5 py-3 font-medium">Program</th>
                                                        <th className="px-5 py-3 text-right font-medium">Time</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-slate-200">
                                                    {pagedRows.map((row) => (
                                                        <tr key={row.id} className="hover:bg-slate-50">
                                                            <td className="px-5 py-3 font-semibold text-slate-800">{row.id}</td>
                                                            <td className="px-5 py-3 text-slate-700">{row.name}</td>
                                                            <td className="px-5 py-3 text-slate-700">{row.program}</td>
                                                            <td className="px-5 py-3 text-right text-slate-700">{row.time}</td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>

                        <div className="space-y-4 lg:col-span-4">
                            <Card className="border-0 shadow-lg">
                                <CardHeader className="pb-3">
                                    <CardTitle className="text-base font-semibold text-slate-800">Last Scanned Student</CardTitle>
                                </CardHeader>
                                <CardContent className="pt-0">
                                    <div className="space-y-3 rounded-xl border border-slate-200 bg-white p-4">
                                        {lastScanned ? (
                                            <div>
                                                <div className="text-xs font-semibold text-slate-500">{lastScanned.id}</div>
                                                <div className="mt-1 text-lg font-semibold text-slate-900">{lastScanned.name}</div>
                                            </div>
                                        ) : (
                                            <div className="text-sm font-semibold text-slate-600">No scans yet.</div>
                                        )}

                                        <div className="grid grid-cols-2 gap-4 text-sm">
                                            <div>
                                                <div className="text-xs font-semibold text-slate-500">Program</div>
                                                <div className="mt-1 font-semibold text-slate-800">{lastScanned?.program ?? '—'}</div>
                                            </div>
                                            <div>
                                                <div className="text-xs font-semibold text-slate-500">Time Scanned</div>
                                                <div className="mt-1 font-semibold text-slate-800">{lastScanned?.time ?? '—'}</div>
                                            </div>
                                        </div>

                                        <div className="flex flex-wrap items-center gap-2">
                                            <div
                                                className={
                                                    'inline-flex items-center gap-2 rounded-md px-3 py-2 text-xs font-semibold ' +
                                                    (lastScanned?.status === 'valid' ? 'bg-emerald-600 text-white' : 'bg-rose-600 text-white')
                                                }
                                            >
                                                {lastScanned?.status === 'valid' ? <CheckCircle2 className="h-4 w-4" /> : <XCircle className="h-4 w-4" />}
                                                {lastScanned?.status === 'valid' ? 'Valid' : 'Invalid'}
                                            </div>
                                            <div className="inline-flex items-center gap-2 rounded-md border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700">
                                                {lastScanned?.status === 'valid' ? <CheckCircle2 className="h-4 w-4 text-emerald-600" /> : <XCircle className="h-4 w-4 text-rose-600" />}
                                                {lastScanned?.status === 'valid' ? 'Valid' : 'Invalid'}
                                            </div>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>

                            <Card className="border-0 shadow-lg">
                                <CardHeader className="pb-3">
                                    <CardTitle className="text-base font-semibold text-slate-800">Attendance Log</CardTitle>
                                </CardHeader>
                                <CardContent className="pt-0">
                                    <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
                                        <div className="overflow-x-auto">
                                            <table className="w-full text-left text-sm">
                                                <thead className="bg-slate-50 text-slate-700">
                                                    <tr>
                                                        <th className="px-4 py-3 font-medium">Student ID</th>
                                                        <th className="px-4 py-3 font-medium">Name</th>
                                                        <th className="px-4 py-3 font-medium">Program</th>
                                                        <th className="px-4 py-3 text-right font-medium">Status</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-slate-200">
                                                    {pagedRows.map((row) => (
                                                        <tr key={row.id} className="hover:bg-slate-50">
                                                            <td className="px-4 py-3 font-semibold text-slate-800">{row.id}</td>
                                                            <td className="px-4 py-3 text-slate-700">{row.name}</td>
                                                            <td className="px-4 py-3 text-slate-700">{row.program}</td>
                                                            <td className="px-4 py-3 text-right">
                                                                <span
                                                                    className={
                                                                        'inline-flex items-center gap-2 rounded-md px-3 py-1 text-xs font-semibold ' +
                                                                        (row.status === 'valid'
                                                                            ? 'bg-emerald-600 text-white'
                                                                            : 'bg-rose-600 text-white')
                                                                    }
                                                                >
                                                                    {row.status === 'valid' ? <CheckCircle2 className="h-4 w-4" /> : <XCircle className="h-4 w-4" />}
                                                                    {row.status === 'valid' ? 'Valid' : 'Invalid'}
                                                                </span>
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>

                                        <div className="flex items-center justify-between px-3 py-4">
                                            <div className="text-sm text-slate-700">
                                                Showing {startIndex + 1} to {Math.min(startIndex + pageSize, logRows.length)} of {logRows.length} entries
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    disabled={pageIndex <= 1}
                                                    onClick={() => setPageIndex((p) => Math.max(1, p - 1))}
                                                >
                                                    Previous
                                                </Button>
                                                <Button variant="outline" size="sm" className="bg-[#23509A] text-white hover:bg-[#1e4a8a] transition-colors">
                                                    {pageIndex}
                                                </Button>
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    disabled={pageIndex >= totalPages}
                                                    onClick={() => setPageIndex((p) => Math.min(totalPages, p + 1))}
                                                >
                                                    Next
                                                </Button>
                                            </div>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                    </div>
                </div>
            </div>
        </AdminLayout>
    );
}
