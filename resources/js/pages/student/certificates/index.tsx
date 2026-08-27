import StudentLayout from '../components/StudentLayout';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { Head, Link, router, usePage } from '@inertiajs/react';
import axios from 'axios';
import {
    ArrowLeft,
    ArrowRight,
    Award,
    Calendar,
    CalendarCheck2,
    CalendarDays,
    CheckCircle,
    Download,
    Eye,
    FileSpreadsheet,
    FileText,
    Fingerprint,
    Info,
    Loader2,
    Printer,
    Search,
    ShieldCheck,
    UserSquare2,
} from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';


type Certificate = {
    id: string;
    certificate_number: string;
    title: string;
    description: string;
    certificate_type: string;
    student_name: string;
    student_id: string;
    event_name: string;
    event_date?: string;
    issue_date: string;
    issued_by: string;
    signature_name: string;
    signature_title: string;
    is_generated: boolean;
    is_downloaded: boolean;
    generated_at?: string;
    downloaded_at?: string;
};

type AvailableCertificate = {
    event_id: string;
    event_name: string;
    event_date: string;
    has_certificate: boolean;
    evaluation_required: boolean;
    evaluation_completed: boolean;
    can_generate: boolean;
};

type PageProps = {
    student: {
        name: string;
        student_id: string;
        course: string;
        year_level: string;
    };
    certificates: Certificate[];
    availableCertificates: AvailableCertificate[];
    highlightCertificateId?: string | number | null;
};

export default function CertificatesPage() {
    const { props } = usePage<PageProps>();
    const certificates = Array.isArray(props.certificates)
        ? props.certificates
        : [];
    const availableCertificates = Array.isArray(props.availableCertificates)
        ? props.availableCertificates
        : [];
    const highlightedId = props.highlightCertificateId
        ? String(props.highlightCertificateId)
        : null;

    const [generating, setGenerating] = useState<string | null>(null);
    const [downloading, setDownloading] = useState<string | null>(null);
    const [selectedCertificate, setSelectedCertificate] =
        useState<Certificate | null>(null);
    const [showDetails, setShowDetails] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');

    const filteredCertificates = useMemo(() => {
        return certificates.filter(
            (cert) =>
                cert.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                cert.event_name
                    .toLowerCase()
                    .includes(searchTerm.toLowerCase()) ||
                cert.certificate_number
                    .toLowerCase()
                    .includes(searchTerm.toLowerCase()),
        );
    }, [certificates, searchTerm]);

    const highlightedCertificate = useMemo(
        () =>
            certificates.find(
                (certificate) => certificate.id === highlightedId,
            ) ?? null,
        [certificates, highlightedId],
    );

    useEffect(() => {
        if (highlightedCertificate) {
            setSelectedCertificate(highlightedCertificate);
            setShowDetails(true);
        }
    }, [highlightedCertificate]);

    const openCertificate = (certificate: Certificate) => {
        setSelectedCertificate(certificate);
        setShowDetails(true);
    };

    const refreshCertificates = () => {
        router.reload({ only: ['certificates', 'availableCertificates'] });
    };

    const generateCertificate = async (eventId: string) => {
        try {
            setGenerating(eventId);
            await axios.post(`/student/certificates/generate/${eventId}`);
            refreshCertificates();
        } catch (error: any) {
            alert(
                error.response?.data?.message ||
                    'Failed to generate certificate',
            );
        } finally {
            setGenerating(null);
        }
    };

    const downloadCertificate = (certificateId: string) => {
        setDownloading(certificateId);

        const link = document.createElement('a');
        link.href = `/student/certificates/${certificateId}/download`;
        link.download = '';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        window.setTimeout(() => {
            setDownloading(null);
            refreshCertificates();
        }, 1200);
    };

    const printCertificate = () => {
        window.print();
    };

    const getStatusBadge = (certificate: Certificate) => {
        if (certificate.is_downloaded) {
            return (
                <Badge className="bg-emerald-100 text-emerald-800 hover:bg-emerald-100">
                    Downloaded
                </Badge>
            );
        }

        if (certificate.is_generated) {
            return <Badge variant="outline">Ready</Badge>;
        }

        return <Badge variant="secondary">Ready to generate</Badge>;
    };

    const getAvailableStatusBadge = (cert: AvailableCertificate) => {
        if (cert.has_certificate) {
            return (
                <Badge className="bg-emerald-100 text-emerald-800 hover:bg-emerald-100">
                    Generated
                </Badge>
            );
        }

        if (!cert.evaluation_completed) {
            return <Badge variant="destructive">Evaluation Required</Badge>;
        }

        return <Badge variant="outline">Available</Badge>;
    };

    return (
        <>
            <StudentLayout>
                <Head title="Certificates" />
                <style>{`
                @media print {
                    /* 1. Force absolute page orientation size, stripping any browser margins */
                    @page {
                        size: A4 landscape !important;
                        margin: 0mm !important;
                    }

                    /* 2. Reset html/body elements to fit standard hardware landscape dimensions */
                    html, body {
                        margin: 0 !important;
                        padding: 0 !important;
                        width: 297mm !important;
                        height: 210mm !important;
                        overflow: hidden !important;
                        background: #ffffff !important;
                        -webkit-print-color-adjust: exact !important;
                        print-color-adjust: exact !important;
                    }

                    /* 3. Hide all screen interface dashboard layers completely */
                    body * {
                        visibility: hidden !important;
                    }

                    /* 4. Isolate print frame canvas elements to make visible */
                    .certificate-print-area,
                    .certificate-print-area * {
                        visibility: visible !important;
                    }

                    /* 5. Force background canvas layout container to snap to exactly 1 single sheet */
                    .certificate-print-area {
                        position: fixed !important;
                        left: 0 !important;
                        top: 0 !important;
                        width: 297mm !important;
                        height: 210mm !important;
                        padding: 0 !important;
                        margin: 0 !important;
                        background: #ffffff !important;
                        display: flex !important;
                        align-items: center !important;
                        justify-content: center !important;
                        box-sizing: border-box !important;
                        page-break-inside: avoid !important;
                        page-break-after: avoid !important;
                        overflow: hidden !important;
                    }

                    /* 6. Enforce structural card container to match sheet padding ratios safely */
                    .certificate-print-area > div {
                        width: 280mm !important;
                        height: 195mm !important;
                        max-width: 280mm !important;
                        max-height: 195mm !important;
                        min-width: 280mm !important;
                        min-height: 195mm !important;
                        border-[12px] border-[#0c2340] !important;
                        box-shadow: none !important;
                        margin: 0 auto !important;
                        padding: 8mm !important;
                        box-sizing: border-box !important;
                        position: relative !important;
                        aspect-ratio: auto !important; /* Strips aspect scaling rules causing the page blowout */
                    }

                    /* 7. Ensure content box scales smoothly inside the hardware container */
                    .certificate-print-area > div > div {
                        height: 100% !important;
                        width: 100% !important;
                        display: flex !important;
                        flex-direction: column !important;
                        justify-content: space-between !important;
                        box-sizing: border-box !important;
                        padding: 4mm !important;
                    }

                    .print\\:hidden {
                        display: none !important;
                    }
                }
            `}</style>

                <div className="mx-auto max-w-7xl px-4 pt-6 pb-12 sm:px-6 lg:px-8">
                        {/* Page Header section with Back Button */}
                        <div className="mb-10 flex flex-col justify-between gap-6 md:flex-row md:items-end">
                            <div className="space-y-4">
                                <Button
                                    asChild
                                    variant="ghost"
                                    size="sm"
                                    className="-ml-2 gap-2 text-slate-500 transition-all hover:bg-blue-50 hover:text-blue-600 dark:hover:bg-blue-900/20"
                                >
                                    <Link href="/student-dashboard">
                                        <ArrowLeft className="h-4 w-4" />
                                        Back to Dashboard
                                    </Link>
                                </Button>

                                <div className="space-y-1">
                                    <h1 className="text-3xl font-black tracking-tight tracking-wider text-slate-900 uppercase dark:text-white">
                                        E-Certificates
                                    </h1>
                                    <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
                                        Manage, download, and print your
                                        official academic achievement awards.
                                    </p>
                                </div>
                            </div>

                            <div className="flex items-center gap-3">
                                <div className="flex h-12 items-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 shadow-sm dark:border-white/5 dark:bg-slate-900/40">
                                    <Award className="h-5 w-5 text-blue-600" />
                                    <div className="flex flex-col">
                                        <span className="text-[10px] font-black tracking-widest text-slate-400 uppercase">
                                            Total Earned
                                        </span>
                                        <span className="text-sm font-black text-slate-900 dark:text-white">
                                            {certificates.length} Awards
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {highlightedCertificate && (
                            <div className="mb-8 overflow-hidden rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-1">
                                <div className="flex items-center justify-between gap-4 rounded-xl bg-white px-4 py-3 dark:bg-slate-900">
                                    <div className="flex items-center gap-3">
                                        <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-emerald-500/20 bg-emerald-500/10 shadow-inner">
                                            <CheckCircle className="h-5 w-5 text-emerald-600" />
                                        </div>
                                        <div>
                                            <p className="text-sm font-black tracking-tight tracking-wider text-slate-900 uppercase dark:text-white">
                                                Evaluation Submitted!
                                            </p>
                                            <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
                                                Your certificate for{' '}
                                                <span className="font-bold text-emerald-600">
                                                    {
                                                        highlightedCertificate.event_name
                                                    }
                                                </span>{' '}
                                                is now ready.
                                            </p>
                                        </div>
                                    </div>
                                    <Button
                                        size="sm"
                                        onClick={() =>
                                            openCertificate(
                                                highlightedCertificate,
                                            )
                                        }
                                        className="rounded-lg bg-emerald-600 px-4 text-[10px] font-black tracking-widest text-white uppercase shadow-lg shadow-emerald-500/20 transition-all hover:bg-emerald-700 active:scale-95"
                                    >
                                        View Now
                                    </Button>
                                </div>
                            </div>
                        )}

                        {availableCertificates.length > 0 && (
                            <div className="mb-12 space-y-6">
                                <div className="flex items-center justify-between px-1">
                                    <div className="flex items-center gap-3">
                                        <div className="flex h-9 w-9 items-center justify-center rounded-lg border border-blue-600/20 bg-blue-600/10 shadow-inner">
                                            <Award className="h-4.5 w-4.5 text-blue-600" />
                                        </div>
                                        <div>
                                            <h2 className="text-base font-black tracking-wider text-slate-900 uppercase dark:text-white">
                                                Available Certificates
                                            </h2>
                                            <p className="mt-0.5 text-[10px] font-bold tracking-[0.2em] text-slate-400 uppercase dark:text-slate-500">
                                                Ready to be generated
                                            </p>
                                        </div>
                                    </div>
                                    <Badge className="rounded-lg border border-blue-500/20 bg-blue-500/10 px-3 py-1 text-[10px] font-black tracking-widest text-blue-600 uppercase backdrop-blur-md dark:bg-blue-500/20 dark:text-blue-400">
                                        {availableCertificates.length} Pending
                                    </Badge>
                                </div>

                                <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
                                    {availableCertificates.map((cert) => (
                                        <Card
                                            key={cert.event_id}
                                            className="group overflow-hidden rounded-2xl border-none bg-white shadow-lg backdrop-blur-xl transition-all duration-500 hover:-translate-y-1 hover:shadow-blue-500/5 dark:bg-slate-900/40"
                                        >
                                            <div className="relative p-6">
                                                <div className="mb-6 flex items-start justify-between gap-4">
                                                    <div className="flex min-w-0 items-center gap-4">
                                                        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-blue-600 to-indigo-700 text-white shadow-xl transition-transform duration-700 group-hover:scale-105">
                                                            <FileText className="h-6 w-6" />
                                                        </div>
                                                        <div className="min-w-0 space-y-0.5">
                                                            <h3 className="truncate text-base font-black tracking-tight text-slate-900 transition-colors group-hover:text-blue-600 dark:text-white">
                                                                {
                                                                    cert.event_name
                                                                }
                                                            </h3>
                                                            <div className="flex items-center gap-2">
                                                                <div className="flex items-center gap-1.5 rounded-md border border-slate-200/50 bg-slate-100 px-2 py-0.5 dark:border-white/5 dark:bg-white/5">
                                                                    <Calendar className="h-3 w-3 text-slate-400" />
                                                                    <span className="text-[9px] font-black tracking-widest text-slate-400 uppercase dark:text-slate-500">
                                                                        {
                                                                            cert.event_date
                                                                        }
                                                                    </span>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                    {cert.evaluation_completed ? (
                                                        <Badge className="rounded-md border border-emerald-500/20 bg-emerald-500/10 px-2 py-0.5 text-[8px] font-black tracking-[0.2em] text-emerald-600 uppercase dark:text-emerald-400">
                                                            Evaluation Done
                                                        </Badge>
                                                    ) : (
                                                        <Badge className="rounded-md border border-rose-500/20 bg-rose-500/10 px-2 py-0.5 text-[8px] font-black tracking-[0.2em] text-rose-600 uppercase dark:text-rose-400">
                                                            Evaluation Required
                                                        </Badge>
                                                    )}
                                                </div>

                                                <div className="group/info relative mb-6 overflow-hidden rounded-xl border border-slate-100 bg-slate-50 p-4 dark:border-white/5 dark:bg-white/5">
                                                    <div className="absolute top-0 right-0 p-2 opacity-10 transition-opacity group-hover/info:opacity-20">
                                                        <Info className="h-8 w-8 text-blue-600" />
                                                    </div>
                                                    <div className="relative z-10 flex items-start gap-3">
                                                        <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-blue-100 dark:bg-blue-500/20">
                                                            <Fingerprint className="h-3 w-3 text-blue-600 dark:text-blue-400" />
                                                        </div>
                                                        <div className="space-y-0.5">
                                                            <p className="text-[10px] font-bold tracking-tight text-slate-900 uppercase dark:text-white">
                                                                One-time
                                                                Generation
                                                            </p>
                                                            <p className="text-xs leading-relaxed font-medium text-slate-600 dark:text-slate-400">
                                                                Generating will
                                                                officially issue
                                                                your certificate
                                                                with a unique
                                                                tracking number.
                                                            </p>
                                                        </div>
                                                    </div>
                                                </div>

                                                {cert.can_generate ? (
                                                    <Button
                                                        disabled={
                                                            generating ===
                                                            cert.event_id
                                                        }
                                                        onClick={() =>
                                                            generateCertificate(
                                                                cert.event_id,
                                                            )
                                                        }
                                                        className="h-10 w-full rounded-lg bg-slate-900 text-[10px] font-black tracking-[0.2em] text-white uppercase shadow-md transition-all duration-500 hover:bg-blue-600 hover:text-white active:scale-[0.98] dark:bg-white dark:text-slate-900 dark:hover:bg-blue-600"
                                                    >
                                                        {generating ===
                                                        cert.event_id ? (
                                                            <>
                                                                <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />
                                                                Generating...
                                                            </>
                                                        ) : (
                                                            <>
                                                                Issue
                                                                E-Certificate
                                                                <Award className="ml-2 h-3.5 w-3.5 transition-transform group-hover:scale-110" />
                                                            </>
                                                        )}
                                                    </Button>
                                                ) : (
                                                    <Button
                                                        variant="outline"
                                                        asChild
                                                        className="h-10 w-full rounded-lg border-slate-200 text-[10px] font-black tracking-[0.2em] uppercase transition-all duration-500 active:scale-[0.98] dark:border-white/10"
                                                    >
                                                        <Link href="/student-dashboard">
                                                            Complete Evaluation
                                                            <ArrowRight className="ml-2 h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
                                                        </Link>
                                                    </Button>
                                                )}
                                            </div>
                                        </Card>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* SEARCH AND FILTERS */}
                        <div className="mb-8 space-y-6">
                            <div className="flex items-center justify-between px-1">
                                <div className="flex items-center gap-3">
                                    <div className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-600/20 bg-slate-600/10 shadow-inner">
                                        <Download className="h-4.5 w-4.5 text-slate-600" />
                                    </div>
                                    <div>
                                        <h2 className="text-base font-black tracking-wider text-slate-900 uppercase dark:text-white">
                                            Earned Certificates
                                        </h2>
                                        <p className="mt-0.5 text-[10px] font-bold tracking-[0.2em] text-slate-400 uppercase dark:text-slate-500">
                                            Your official academic collection
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <div className="group relative">
                                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4">
                                    <Search className="h-4 w-4 text-slate-400 transition-colors group-focus-within:text-blue-500" />
                                </div>
                                <Input
                                    type="text"
                                    placeholder="Search by title, event, or certificate number..."
                                    value={searchTerm}
                                    onChange={(e) =>
                                        setSearchTerm(e.target.value)
                                    }
                                    className="h-12 w-full rounded-2xl border-slate-200 bg-white pl-11 text-sm shadow-sm focus:ring-blue-500/20 dark:border-white/5 dark:bg-slate-900/40"
                                />
                            </div>
                        </div>

                        {filteredCertificates.length === 0 ? (
                            <Card className="group/empty overflow-hidden rounded-2xl border-none bg-white/80 shadow-lg backdrop-blur-xl dark:bg-slate-900/40">
                                <CardContent className="relative py-20 text-center">
                                    <div className="absolute top-1/2 left-1/2 h-[300px] w-[300px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-blue-500/5 blur-[80px] transition-transform duration-1000 group-hover/empty:scale-110" />

                                    <div className="relative z-10">
                                        <div className="relative mx-auto mb-6 h-24 w-24">
                                            <div className="absolute inset-0 animate-ping rounded-full bg-blue-100 opacity-10 dark:bg-blue-900/20" />
                                            <div className="relative flex h-full w-full items-center justify-center rounded-full border-4 border-white bg-slate-50 shadow-xl dark:border-slate-700/50 dark:bg-slate-800/50">
                                                <Award className="h-10 w-10 text-slate-300 dark:text-slate-600" />
                                            </div>
                                        </div>
                                        <div className="mx-auto max-w-md space-y-2">
                                            <h3 className="text-xl font-black tracking-tight tracking-wider text-slate-900 uppercase dark:text-white">
                                                {searchTerm
                                                    ? 'No matches found'
                                                    : 'No certificates yet'}
                                            </h3>
                                            <p className="px-6 text-xs leading-relaxed font-medium text-slate-500 dark:text-slate-400">
                                                {searchTerm
                                                    ? `We couldn't find any certificates matching "${searchTerm}". Try a different keyword.`
                                                    : 'Complete event attendance and evaluations to receive your official certificates here.'}
                                            </p>
                                            {!searchTerm && (
                                                <div className="pt-6">
                                                    <Button
                                                        asChild
                                                        className="h-9 rounded-lg bg-blue-600 px-8 text-[9px] font-black tracking-[0.2em] text-white uppercase shadow-md shadow-blue-500/20 transition-all hover:bg-blue-700 active:scale-95"
                                                    >
                                                        <Link href="/student-dashboard">
                                                            Explore Events
                                                        </Link>
                                                    </Button>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        ) : (
                            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
                                {filteredCertificates.map((certificate) => (
                                    <Card
                                        key={certificate.id}
                                        className="group relative overflow-hidden rounded-2xl border-none bg-white shadow-lg backdrop-blur-xl transition-all duration-500 hover:-translate-y-1.5 hover:shadow-blue-500/10 dark:bg-slate-900/40"
                                    >
                                        {/* Accent Top Border */}
                                        <div className="absolute top-0 left-0 h-1 w-full bg-gradient-to-r from-blue-600 to-indigo-600 opacity-40 transition-opacity group-hover:opacity-100" />

                                        <CardContent className="p-6">
                                            <div className="flex h-full flex-col">
                                                <div className="mb-4 flex items-start justify-between gap-4">
                                                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-slate-100 bg-slate-50 text-blue-600 shadow-inner transition-all duration-700 group-hover:scale-110 group-hover:rotate-3 dark:border-white/5 dark:bg-white/5">
                                                        <Award className="h-6 w-6" />
                                                    </div>
                                                    <Badge
                                                        className={cn(
                                                            'rounded-lg px-2 py-0.5 text-[8px] font-black tracking-[0.2em] uppercase',
                                                            certificate.is_downloaded
                                                                ? 'border border-emerald-500/20 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                                                                : 'border border-blue-500/20 bg-blue-500/10 text-blue-600 dark:text-blue-400',
                                                        )}
                                                    >
                                                        {certificate.is_downloaded
                                                            ? 'Downloaded'
                                                            : 'Ready'}
                                                    </Badge>
                                                </div>

                                                <div className="mb-6 flex-1 space-y-1.5">
                                                    <h3 className="line-clamp-2 text-base leading-tight font-black tracking-tight text-slate-900 transition-colors group-hover:text-blue-600 dark:text-white">
                                                        {certificate.title}
                                                    </h3>
                                                    <div className="flex flex-col gap-1">
                                                        <div className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400">
                                                            <Calendar className="h-3 w-3" />
                                                            <span className="text-[10px] font-bold tracking-widest uppercase">
                                                                {
                                                                    certificate.event_name
                                                                }
                                                            </span>
                                                        </div>
                                                        <div className="flex items-center gap-1.5 text-slate-400">
                                                            <Fingerprint className="h-3 w-3" />
                                                            <span className="text-[9px] font-medium tracking-tighter">
                                                                #
                                                                {
                                                                    certificate.certificate_number
                                                                }
                                                            </span>
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className="flex items-center justify-between gap-3 border-t border-slate-100 pt-4 dark:border-white/5">
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        onClick={() =>
                                                            openCertificate(
                                                                certificate,
                                                            )
                                                        }
                                                        className="h-9 flex-1 rounded-lg border-slate-200 text-[9px] font-black tracking-widest uppercase transition-all hover:bg-slate-50 dark:border-white/10 dark:hover:bg-white/5"
                                                    >
                                                        <Eye className="mr-1.5 h-3.5 w-3.5" />
                                                        Preview
                                                    </Button>
                                                    <Button
                                                        size="sm"
                                                        disabled={
                                                            downloading ===
                                                            certificate.id
                                                        }
                                                        onClick={() =>
                                                            downloadCertificate(
                                                                certificate.id,
                                                            )
                                                        }
                                                        className="h-9 flex-1 rounded-lg bg-slate-900 text-[9px] font-black tracking-widest text-white uppercase shadow-md transition-all hover:bg-blue-600 hover:text-white active:scale-95 dark:bg-white dark:text-slate-900 dark:hover:bg-blue-600"
                                                    >
                                                        {downloading ===
                                                        certificate.id ? (
                                                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                                        ) : (
                                                            <>
                                                                <Download className="mr-1.5 h-3.5 w-3.5" />
                                                                Download
                                                            </>
                                                        )}
                                                    </Button>
                                                </div>
                                            </div>
                                        </CardContent>
                                    </Card>
                                ))}
                            </div>
                        )}
                    </div>
            </StudentLayout>

            <Dialog open={showDetails} onOpenChange={setShowDetails}>
                <DialogContent className="fixed top-[50%] left-[50%] z-50 w-[95vw] translate-x-[-50%] translate-y-[-50%] overflow-hidden border bg-white p-6 shadow-2xl duration-200 sm:max-w-[825px] sm:rounded-xl">
                    {/* Header Controls */}
                    <div className="mb-4 flex items-center justify-between border-b border-gray-100 pb-3 print:hidden">
                        <div>
                            <h3 className="text-lg font-bold text-slate-900">
                                Certificate Details
                            </h3>
                            <p className="text-xs text-slate-500">
                                View, print, or download your evaluation
                                completion certificate.
                            </p>
                        </div>
                    </div>

                    {selectedCertificate && (
                        <div className="certificate-print-area flex w-full items-center justify-center rounded-lg bg-[#0d1e36] p-4 print:rounded-none print:bg-white print:p-0">
                            {/* Outer Frame Box Container */}
                            <div className="relative aspect-[1.414/1] w-full max-w-[880px] rounded-none border-[14px] border-[#0c2340] bg-white p-5 shadow-xl print:border-[12px] print:shadow-none">
                                {/* Inner Accent Border Line */}
                                <div className="relative flex h-full w-full flex-col justify-between border-[2px] border-[#c5a059] p-5">
                                    {/* Watermark Logo Background Layer */}
                                    <div className="pointer-events-none absolute inset-0 flex items-center justify-center opacity-[0.03]">
                                        <img
                                            src="/images/SRCB.png"
                                            alt=""
                                            className="h-64 w-64 object-contain"
                                        />
                                    </div>

                                    {/* Top Institutional Heading Frame */}
                                    <div className="relative z-10 flex items-center justify-between">
                                        <div className="flex items-center space-x-3.5">
                                            <img
                                                src="/images/SRCB.png"
                                                alt="School logo"
                                                className="h-12 w-12 object-contain"
                                            />
                                            <div>
                                                <h4 className="text-[10px] font-bold tracking-[0.18em] text-[#0c2340] uppercase">
                                                    St. Rita's College of
                                                    Balingasag
                                                </h4>
                                                <p className="mt-0.5 text-[8px] font-semibold tracking-[0.12em] text-slate-500 uppercase">
                                                    Department of Student
                                                    Affairs
                                                </p>
                                            </div>
                                        </div>
                                        <img
                                            src="/images/DSA.png"
                                            alt="DSA logo"
                                            className="h-12 w-12 rounded-full object-cover shadow-sm ring-2 ring-slate-100"
                                        />
                                    </div>

                                    {/* Badge Certificate Context Type Row */}
                                    <div className="relative z-10 my-0.5 flex items-center justify-center gap-3 text-center">
                                        <div className="h-[1px] w-12 bg-[#c5a059]/60" />
                                        <span className="text-[8px] font-extrabold tracking-[0.25em] text-[#0c2340] uppercase">
                                            EVALUATION COMPLETION
                                        </span>
                                        <div className="h-[1px] w-12 bg-[#c5a059]/60" />
                                    </div>

                                    {/* Main Component Presentation Titles */}
                                    <div className="relative z-10 my-0.5 text-center">
                                        <h2 className="font-serif text-[34px] leading-none font-bold tracking-wide text-[#0c2340]">
                                            CERTIFICATE
                                        </h2>
                                        <p className="mt-0.5 font-serif text-[16px] text-[#b38f43] italic">
                                            of Evaluation Completion
                                        </p>
                                    </div>

                                    {/* Nominated Recipient Context Text Layout block */}
                                    <div className="relative z-10 mx-auto my-1 max-w-[85%] text-center">
                                        <p className="mb-0.5 text-[8px] font-medium tracking-[0.16em] text-slate-400 uppercase">
                                            THIS CERTIFICATE IS PROUDLY
                                            PRESENTED TO
                                        </p>
                                        <h1 className="inline-block min-w-[70%] border-b border-[#c5a059] px-4 pb-1 font-serif text-[24px] font-bold text-[#0c2340]">
                                            {selectedCertificate.student_name ||
                                                props.student.name}
                                        </h1>
                                        <p className="mt-2 text-[10px] leading-relaxed font-normal text-slate-600">
                                            for successfully completing the
                                            event evaluation for{' '}
                                            <span className="font-bold text-slate-900">
                                                {selectedCertificate.event_name}
                                            </span>
                                            . This certificate serves as
                                            official proof of evaluation
                                            completion.
                                        </p>
                                    </div>

                                    {/* Detailed Badge Metrics Meta Grid */}
                                    <div className="relative z-10 my-2">
                                        <div className="grid grid-cols-6 rounded-xl border border-slate-200/80 bg-slate-50/50 p-2 text-center shadow-sm">
                                            <div className="flex flex-col items-center justify-center px-1">
                                                <Fingerprint className="mb-0.5 h-3.5 w-3.5 text-[#b38f43]" />
                                                <div className="text-[6.5px] font-bold tracking-wider text-slate-400 uppercase">
                                                    Certificate Number
                                                </div>
                                                <div className="mt-0.5 text-[8px] font-bold tracking-tight text-slate-800">
                                                    {
                                                        selectedCertificate.certificate_number
                                                    }
                                                </div>
                                            </div>
                                            <div className="flex flex-col items-center justify-center border-l border-slate-200 px-1">
                                                <UserSquare2 className="mb-0.5 h-3.5 w-3.5 text-[#b38f43]" />
                                                <div className="text-[6.5px] font-bold tracking-wider text-slate-400 uppercase">
                                                    Student ID
                                                </div>
                                                <div className="mt-0.5 text-[8px] font-bold text-slate-800">
                                                    {selectedCertificate.student_id ||
                                                        props.student
                                                            .student_id}
                                                </div>
                                            </div>
                                            <div className="flex flex-col items-center justify-center border-l border-slate-200 px-1">
                                                <CalendarDays className="mb-0.5 h-3.5 w-3.5 text-[#b38f43]" />
                                                <div className="text-[6.5px] font-bold tracking-wider text-slate-400 uppercase">
                                                    Event Date
                                                </div>
                                                <div className="mt-0.5 text-[8px] font-bold text-slate-800">
                                                    {selectedCertificate.event_date ||
                                                        'N/A'}
                                                </div>
                                            </div>
                                            <div className="flex flex-col items-center justify-center border-l border-slate-200 px-1">
                                                <CalendarCheck2 className="mb-0.5 h-3.5 w-3.5 text-[#b38f43]" />
                                                <div className="text-[6.5px] font-bold tracking-wider text-slate-400 uppercase">
                                                    Issue Date
                                                </div>
                                                <div className="mt-0.5 text-[8px] font-bold text-slate-800">
                                                    {
                                                        selectedCertificate.issue_date
                                                    }
                                                </div>
                                            </div>
                                            <div className="flex flex-col items-center justify-center border-l border-slate-200 px-1">
                                                <ShieldCheck className="mb-0.5 h-3.5 w-3.5 text-[#b38f43]" />
                                                <div className="text-[6.5px] font-bold tracking-wider text-slate-400 uppercase">
                                                    Issued By
                                                </div>
                                                <div className="mt-0.5 max-w-[90%] text-[7.5px] leading-tight font-bold text-slate-800">
                                                    {
                                                        selectedCertificate.issued_by
                                                    }
                                                </div>
                                            </div>
                                            <div className="flex flex-col items-center justify-center border-l border-slate-200 px-1">
                                                <FileSpreadsheet className="mb-0.5 h-3.5 w-3.5 text-[#b38f43]" />
                                                <div className="text-[6.5px] font-bold tracking-wider text-slate-400 uppercase">
                                                    Certificate Type
                                                </div>
                                                <div className="mt-0.5 text-[7.5px] leading-tight font-bold text-slate-800">
                                                    {selectedCertificate.certificate_type.replace(
                                                        '_',
                                                        ' ',
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Signatures & Decorative Medal Base Row Layout */}
                                    <div className="relative z-10 mt-2 flex items-center justify-between px-6">
                                        {/* 1. Left Column: Ribbon Wrapper */}
                                        <div className="relative flex w-[180px] items-center justify-start">
                                            <div className="relative -mt-4 flex flex-col items-center justify-center">
                                                <div className="z-20 flex h-11 w-11 items-center justify-center rounded-full border-2 border-white bg-gradient-to-br from-[#dfba6b] via-[#c5a059] to-[#ac843b] shadow-md ring-1 ring-[#c5a059]">
                                                    <Award className="h-5.5 w-5.5 text-white" />
                                                </div>
                                                {/* Ribbon Tails */}
                                                <div className="absolute top-7 z-10 flex space-x-1.5">
                                                    <div className="clip-ribbon h-8 w-2.5 origin-top -rotate-12 transform bg-[#ac843b]" />
                                                    <div className="clip-ribbon h-8 w-2.5 origin-top rotate-12 transform bg-[#8c6621]" />
                                                </div>
                                            </div>
                                        </div>

                                        {/* 2. Center Column: Signature Wrapper */}
                                        <div className="flex flex-1 flex-col items-center justify-center text-center">
                                            <div className="inline-block min-w-[200px] border-b border-slate-400/80 px-4 pb-1 text-[10px] font-bold text-slate-900">
                                                {
                                                    selectedCertificate.signature_name
                                                }
                                            </div>
                                            <div className="mt-1 text-[7.5px] font-bold text-slate-800">
                                                Dean of Student Affairs
                                            </div>
                                        </div>

                                        {/* 3. Right Column: Balance Spacer */}
                                        <div
                                            className="w-[180px] shrink-0"
                                            aria-hidden="true"
                                        ></div>
                                    </div>

                                    {/* Bottom Verification Footer Tag */}
                                    <div className="mt-2 flex items-center justify-between border-t border-slate-100 pt-1 text-[6.5px] font-semibold tracking-[0.15em] text-slate-400 uppercase">
                                        <span>Verified through DSAMS</span>
                                        <span>
                                            {
                                                selectedCertificate.certificate_number
                                            }
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Modal Controls Actions Bar */}
                    {selectedCertificate && (
                        <div className="mt-4 flex justify-end gap-2.5 border-t border-gray-100 pt-3 print:hidden">
                            <Button
                                variant="outline"
                                onClick={printCertificate}
                                className="gap-2 border-slate-200 text-slate-700 hover:text-slate-900"
                            >
                                <Printer className="h-4 w-4" />
                                Print
                            </Button>

                            <Button
                                onClick={() =>
                                    downloadCertificate(selectedCertificate.id)
                                }
                                disabled={
                                    downloading === selectedCertificate.id
                                }
                                className="gap-2 bg-[#0c2340] text-white hover:bg-[#14325c]"
                            >
                                {downloading === selectedCertificate.id ? (
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                    <Download className="h-4 w-4" />
                                )}
                                Download
                            </Button>
                        </div>
                    )}
                </DialogContent>
            </Dialog>
        </>
    );
}

function Detail({
    label,
    value,
    wide = false,
}: {
    label: string;
    value?: string;
    wide?: boolean;
}) {
    return (
        <div className={wide ? 'sm:col-span-2' : undefined}>
            <div className="text-xs font-semibold tracking-wide text-slate-500 uppercase">
                {label}
            </div>
            <div className="mt-1 font-medium text-slate-900">
                {value || 'N/A'}
            </div>
        </div>
    );
}
