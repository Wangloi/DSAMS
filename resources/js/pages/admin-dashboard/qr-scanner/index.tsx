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
    Users
} from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { cn } from '@/lib/utils';
import { adminAttendance, adminAttendanceLogs, adminAttendanceStudentsByCourse } from '@/routes';
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

export default function AdminQrScannerPage({ event, logs, breakdown }: any) {
    const videoRef = useRef<HTMLVideoElement>(null);
    const codeReaderRef = useRef<BrowserQRCodeReader | null>(null);
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
        try {
            const res = await fetch(adminAttendanceLogs(event.id), {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Accept: 'application/json',
                    'X-CSRF-TOKEN': (document.querySelector('meta[name="csrf-token"]') as any)?.content,
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
            }
            // Clear feedback after 3 seconds
            setTimeout(() => setLastScanned(null), 3000);
        } catch (err) {
            console.error(err);
            setLastScanned({ status: 'invalid', message: 'Network error occurred' });
        }
    };

    const handleViewStudentsByCourse = async (program: string) => {
        setSelectedCourse(program);
        setCourseStudentsLoading(true);
        setCourseStudentsError(null);
        setShowCourseStudentsModal(true);
        try {
            const res = await fetch(adminAttendanceStudentsByCourse(event.id, program), {
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

    useEffect(() => {
        return () => stop();
    }, []);

    return (
        <AdminLayout breadcrumbs={breadcrumbs}>
            <Head title="Attendance Scanner" />

            <div className="min-h-[calc(100vh-4rem)] bg-slate-50/50 dark:bg-slate-900">
                <div className="flex w-full flex-col gap-6 px-6 py-8">
                    {/* Page Header */}
                    {event ? (
                        <div className="overflow-hidden rounded-3xl bg-[#0b2d66] dark:bg-[#0B192C]/80 border border-slate-200 dark:border-slate-800 shadow-xl shadow-blue-500/5 backdrop-blur-md">
                            <div className="flex flex-col gap-6 px-8 py-8 sm:flex-row sm:items-center sm:justify-between">
                                <div className="space-y-4">
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        className="h-9 gap-2 rounded-xl bg-white/10 px-4 text-xs font-bold uppercase tracking-widest text-white hover:bg-white/20 transition-all duration-300"
                                        asChild
                                    >
                                        <Link href={adminAttendance()}>
                                            <ArrowLeft className="h-4 w-4" />
                                            Back to Attendance
                                        </Link>
                                    </Button>
                                    <div>
                                        <h1 className="text-2xl font-black tracking-tight text-white sm:text-3xl">
                                            Attendance Scanner
                                        </h1>
                                        <div className="mt-2 flex flex-wrap items-center gap-3">
                                            <Badge className="bg-white/20 text-white border-transparent backdrop-blur-md font-bold uppercase tracking-wider text-[10px]">
                                                {event.name}
                                            </Badge>
                                            <div className="flex items-center gap-2 text-sm font-medium text-blue-100/80">
                                                <CalendarDays className="h-4 w-4" />
                                                {event.date}
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <Button 
                                    type="button" 
                                    className="h-12 gap-3 rounded-2xl bg-white px-6 text-sm font-bold text-[#0b2d66] shadow-lg shadow-black/10 transition-all duration-300 hover:scale-[1.02] hover:bg-slate-50 active:scale-[0.98]"
                                >
                                    <Eye className="h-5 w-5" />
                                    View Live Attendance
                                </Button>
                            </div>
                        </div>
                    ) : (
                        <div className="overflow-hidden rounded-3xl bg-[#0b2d66] dark:bg-[#0B192C]/80 px-8 py-8 text-white border border-slate-200 dark:border-slate-800 shadow-xl">
                            <h1 className="text-2xl font-black tracking-tight">Attendance Scanner</h1>
                            <p className="mt-2 text-blue-100/80 font-medium">Select an event from the Event List to start scanning.</p>
                        </div>
                    )}

                    {/* Notification Banners */}
                    <div className="space-y-3">
                        {event?.scannerPortalActive === false && (
                            <div className="flex items-center gap-3 rounded-2xl border border-amber-200 bg-amber-50/50 p-4 text-sm font-bold text-amber-900 backdrop-blur-md dark:border-amber-500/20 dark:bg-amber-500/10 dark:text-amber-200">
                                <AlertCircle className="h-5 w-5 shrink-0" />
                                Scanner portal is not activated yet. Please activate it in Real-time Monitoring.
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
                                                            <td className="px-8 py-4 text-sm font-black text-slate-900 dark:text-white">{row.id}</td>
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

                                    {/* Time Block */}
                                    <div className="p-6 rounded-[2rem] bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-950/20 dark:to-orange-900/20 border border-amber-100 dark:border-amber-900/30">
                                        <div className="flex items-center gap-2 mb-4">
                                            <Clock className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                                            <span className="text-xs font-black uppercase tracking-widest text-amber-700 dark:text-amber-400">Timeline</span>
                                        </div>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="space-y-1">
                                                <p className="text-[10px] font-black uppercase tracking-widest text-amber-600/60">Starts</p>
                                                <p className="text-base font-black text-amber-900 dark:text-amber-200">{formatTime12h(event?.timeIn)}</p>
                                            </div>
                                            <div className="space-y-1 border-l border-amber-200 dark:border-amber-800 pl-4">
                                                <p className="text-[10px] font-black uppercase tracking-widest text-amber-600/60">Ends</p>
                                                <p className="text-base font-black text-amber-900 dark:text-amber-200">{formatTime12h(event?.timeEnd)}</p>
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

                    {/* Attendance by Course Table */}
                    {byCourse.length > 0 && (
                        <Card className="overflow-hidden border-0 bg-white dark:bg-[#0B192C]/50 shadow-2xl shadow-blue-500/5 rounded-[2rem]">
                            <CardHeader className="border-b border-slate-50 dark:border-slate-800/50 px-8 py-6 bg-slate-50/30 dark:bg-slate-900/30">
                                <div className="flex items-center gap-3">
                                    <div className="p-2.5 rounded-xl bg-blue-600/10 dark:bg-blue-600/20 text-blue-600 dark:text-blue-400">
                                        <Users className="h-5 w-5" />
                                    </div>
                                    <CardTitle className="text-lg font-black tracking-tight text-slate-900 dark:text-white uppercase">Attendance by Program</CardTitle>
                                </div>
                            </CardHeader>
                            <CardContent className="p-0">
                                <div className="overflow-x-auto">
                                    <table className="w-full">
                                        <thead className="bg-slate-50/50 dark:bg-slate-900/50 border-b border-slate-100 dark:border-slate-800">
                                            <tr>
                                                <th className="px-8 py-4 text-[10px] font-black uppercase tracking-[0.15em] text-slate-500">Program</th>
                                                <th className="px-8 py-4 text-[10px] font-black uppercase tracking-[0.15em] text-slate-500 text-right">Expected</th>
                                                <th className="px-8 py-4 text-[10px] font-black uppercase tracking-[0.15em] text-slate-500 text-right">Scanned</th>
                                                <th className="px-8 py-4 text-[10px] font-black uppercase tracking-[0.15em] text-slate-500 text-right">Remaining</th>
                                                <th className="px-8 py-4 text-[10px] font-black uppercase tracking-[0.15em] text-slate-500 text-right">Progress</th>
                                                <th className="px-8 py-4 text-[10px] font-black uppercase tracking-[0.15em] text-slate-500 text-right">Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-50 dark:divide-slate-800">
                                            {byCourse.map((c) => (
                                                <tr key={c.program} className="group hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-all duration-200">
                                                    <td className="px-8 py-6">
                                                        <div className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-tight">{c.program}</div>
                                                    </td>
                                                    <td className="px-8 py-6 text-right">
                                                        <span className="text-sm font-black text-slate-700 dark:text-slate-300">{Number(c.expected).toLocaleString()}</span>
                                                    </td>
                                                    <td className="px-8 py-6 text-right">
                                                        <span className="text-sm font-black text-blue-600 dark:text-blue-400">{Number(c.scanned).toLocaleString()}</span>
                                                    </td>
                                                    <td className="px-8 py-6 text-right">
                                                        <span className="text-sm font-black text-slate-500 dark:text-slate-500">{Math.max(0, Number(c.expected) - Number(c.scanned)).toLocaleString()}</span>
                                                    </td>
                                                    <td className="px-8 py-6 text-right w-48">
                                                        <div className="flex flex-col gap-2">
                                                            <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-widest">
                                                                <span className="text-blue-600 dark:text-blue-400">{Math.min(Number(c.percentage ?? 0), 100)}%</span>
                                                            </div>
                                                            <div className="h-2 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden border border-slate-200/50 dark:border-slate-700/50 shadow-inner">
                                                                <div
                                                                    className="h-full bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full transition-all duration-1000 ease-out shadow-[0_0_10px_rgba(59,130,246,0.5)]"
                                                                    style={{ width: `${Math.min(Number(c.percentage ?? 0), 100)}%` }}
                                                                />
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="px-8 py-6 text-right">
                                                        <Button
                                                            type="button"
                                                            size="sm"
                                                            variant="outline"
                                                            className="h-9 gap-2 rounded-xl border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-[10px] font-black uppercase tracking-widest text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700 transition-all duration-300"
                                                            onClick={() => handleViewStudentsByCourse(String(c.program))}
                                                        >
                                                            <Eye className="h-3.5 w-3.5" />
                                                            View Students
                                                        </Button>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </CardContent>
                        </Card>
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
