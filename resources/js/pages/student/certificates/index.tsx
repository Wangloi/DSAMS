import { Head, Link, router, usePage } from '@inertiajs/react';
import axios from 'axios';
import { 
    Award, 
    CheckCircle, 
    Download, 
    Eye, 
    FileText, 
    Loader2, 
    Printer,
    Fingerprint,
    UserSquare2,
    CalendarDays,
    CalendarCheck2,
    ShieldCheck,
    FileSpreadsheet,
    ArrowLeft,
    X,
    Search,
    Filter,
    Info,
    Calendar,
    ArrowRight
} from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { AppShell } from '@/components/app-shell';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { StudentHeader } from '../components/StudentHeader';

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
    const certificates = Array.isArray(props.certificates) ? props.certificates : [];
    const availableCertificates = Array.isArray(props.availableCertificates) ? props.availableCertificates : [];
    const highlightedId = props.highlightCertificateId ? String(props.highlightCertificateId) : null;

    const [generating, setGenerating] = useState<string | null>(null);
    const [downloading, setDownloading] = useState<string | null>(null);
    const [selectedCertificate, setSelectedCertificate] = useState<Certificate | null>(null);
    const [showDetails, setShowDetails] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');

    const filteredCertificates = useMemo(() => {
        return certificates.filter(cert => 
            cert.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
            cert.event_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            cert.certificate_number.toLowerCase().includes(searchTerm.toLowerCase())
        );
    }, [certificates, searchTerm]);

    const highlightedCertificate = useMemo(
        () => certificates.find((certificate) => certificate.id === highlightedId) ?? null,
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
            alert(error.response?.data?.message || 'Failed to generate certificate');
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
            return <Badge className="bg-emerald-100 text-emerald-800 hover:bg-emerald-100">Downloaded</Badge>;
        }

        if (certificate.is_generated) {
            return <Badge variant="outline">Ready</Badge>;
        }

        return <Badge variant="secondary">Ready to generate</Badge>;
    };

    const getAvailableStatusBadge = (cert: AvailableCertificate) => {
        if (cert.has_certificate) {
            return <Badge className="bg-emerald-100 text-emerald-800 hover:bg-emerald-100">Generated</Badge>;
        }

        if (!cert.evaluation_completed) {
            return <Badge variant="destructive">Evaluation Required</Badge>;
        }

        return <Badge variant="outline">Available</Badge>;
    };

    return (
        <>
            <AppShell>
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
                        
                <StudentHeader />
            
                <div className="min-h-screen relative bg-slate-50 dark:bg-[#020617] transition-colors duration-500 overflow-x-hidden">
                    {/* Visual Depth Layers - Mesh Gradients */}
                    <div className="fixed inset-0 overflow-hidden pointer-events-none">
                        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-blue-600/10 dark:bg-blue-600/5 rounded-full blur-[120px] mix-blend-multiply dark:mix-blend-soft-light animate-pulse" />
                        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-indigo-600/10 dark:bg-indigo-600/5 rounded-full blur-[120px] mix-blend-multiply dark:mix-blend-soft-light" />
                        <div className="absolute top-[20%] right-[10%] w-[30%] h-[30%] bg-emerald-600/5 dark:bg-emerald-600/5 rounded-full blur-[100px]" />
                    </div>

                    <div className="mx-auto max-w-7xl px-4 pt-24 pb-12 sm:px-6 lg:px-8 relative z-10">
                        
                        {/* Page Header section with Back Button */}
                        <div className="mb-10 flex flex-col md:flex-row md:items-end justify-between gap-6">
                            <div className="space-y-4">
                                <Button 
                                    asChild 
                                    variant="ghost" 
                                    size="sm" 
                                    className="-ml-2 text-slate-500 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 gap-2 transition-all"
                                >
                                    <Link href="/student-dashboard">
                                        <ArrowLeft className="h-4 w-4" />
                                        Back to Dashboard
                                    </Link>
                                </Button>
                                
                                <div className="space-y-1">
                                    <h1 className="text-3xl font-black tracking-tight text-slate-900 dark:text-white uppercase tracking-wider">E-Certificates</h1>
                                    <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Manage, download, and print your official academic achievement awards.</p>
                                </div>
                            </div>

                            <div className="flex items-center gap-3">
                                <div className="flex h-12 items-center gap-3 rounded-2xl bg-white dark:bg-slate-900/40 px-4 shadow-sm border border-slate-200 dark:border-white/5">
                                    <Award className="h-5 w-5 text-blue-600" />
                                    <div className="flex flex-col">
                                        <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Total Earned</span>
                                        <span className="text-sm font-black text-slate-900 dark:text-white">{certificates.length} Awards</span>
                                    </div>
                                </div>
                            </div>
                        </div>
            
                    {highlightedCertificate && (
                        <div className="mb-8 overflow-hidden rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-1">
                            <div className="flex items-center justify-between gap-4 px-4 py-3 bg-white dark:bg-slate-900 rounded-xl">
                                <div className="flex items-center gap-3">
                                    <div className="h-10 w-10 rounded-xl bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20 shadow-inner">
                                        <CheckCircle className="h-5 w-5 text-emerald-600" />
                                    </div>
                                    <div>
                                        <p className="text-sm font-black text-slate-900 dark:text-white tracking-tight uppercase tracking-wider">Evaluation Submitted!</p>
                                        <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Your certificate for <span className="font-bold text-emerald-600">{highlightedCertificate.event_name}</span> is now ready.</p>
                                    </div>
                                </div>
                                <Button 
                                    size="sm" 
                                    onClick={() => openCertificate(highlightedCertificate)}
                                    className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg px-4 font-black text-[10px] uppercase tracking-widest shadow-lg shadow-emerald-500/20 transition-all active:scale-95"
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
                                    <div className="h-9 w-9 rounded-lg bg-blue-600/10 flex items-center justify-center border border-blue-600/20 shadow-inner">
                                        <Award className="h-4.5 w-4.5 text-blue-600" />
                                    </div>
                                    <div>
                                        <h2 className="text-base font-black uppercase tracking-wider text-slate-900 dark:text-white">Available Certificates</h2>
                                        <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em] mt-0.5">Ready to be generated</p>
                                    </div>
                                </div>
                                <Badge className="rounded-lg bg-blue-500/10 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400 border border-blue-500/20 font-black text-[10px] uppercase tracking-widest px-3 py-1 backdrop-blur-md">
                                    {availableCertificates.length} Pending
                                </Badge>
                            </div>

                            <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
                                {availableCertificates.map((cert) => (
                                    <Card key={cert.event_id} className="group overflow-hidden rounded-2xl border-none bg-white dark:bg-slate-900/40 backdrop-blur-xl shadow-lg transition-all duration-500 hover:shadow-blue-500/5 hover:-translate-y-1">
                                        <div className="relative p-6">
                                            <div className="flex items-start justify-between gap-4 mb-6">
                                                <div className="flex items-center gap-4 min-w-0">
                                                    <div className="h-12 w-12 shrink-0 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-700 flex items-center justify-center text-white shadow-xl group-hover:scale-105 transition-transform duration-700">
                                                        <FileText className="h-6 w-6" />
                                                    </div>
                                                    <div className="min-w-0 space-y-0.5">
                                                        <h3 className="text-base font-black text-slate-900 dark:text-white truncate group-hover:text-blue-600 transition-colors tracking-tight">{cert.event_name}</h3>
                                                        <div className="flex items-center gap-2">
                                                            <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-slate-100 dark:bg-white/5 border border-slate-200/50 dark:border-white/5">
                                                                <Calendar className="h-3 w-3 text-slate-400" />
                                                                <span className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">{cert.event_date}</span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                                {cert.evaluation_completed ? (
                                                    <Badge className="rounded-md bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 font-black text-[8px] uppercase tracking-[0.2em] px-2 py-0.5">
                                                        Evaluation Done
                                                    </Badge>
                                                ) : (
                                                    <Badge className="rounded-md bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20 font-black text-[8px] uppercase tracking-[0.2em] px-2 py-0.5">
                                                        Evaluation Required
                                                    </Badge>
                                                )}
                                            </div>

                                            <div className="p-4 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/5 mb-6 relative overflow-hidden group/info">
                                                <div className="absolute top-0 right-0 p-2 opacity-10 group-hover/info:opacity-20 transition-opacity">
                                                    <Info className="h-8 w-8 text-blue-600" />
                                                </div>
                                                <div className="flex items-start gap-3 relative z-10">
                                                    <div className="h-6 w-6 rounded-lg bg-blue-100 dark:bg-blue-500/20 flex items-center justify-center shrink-0">
                                                        <Fingerprint className="h-3 w-3 text-blue-600 dark:text-blue-400" />
                                                    </div>
                                                    <div className="space-y-0.5">
                                                        <p className="text-[10px] font-bold text-slate-900 dark:text-white uppercase tracking-tight">One-time Generation</p>
                                                        <p className="text-xs font-medium text-slate-600 dark:text-slate-400 leading-relaxed">
                                                            Generating will officially issue your certificate with a unique tracking number.
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>

                                            {cert.can_generate ? (
                                                <Button 
                                                    disabled={generating === cert.event_id}
                                                    onClick={() => generateCertificate(cert.event_id)}
                                                    className="w-full h-10 rounded-lg bg-slate-900 dark:bg-white text-white dark:text-slate-900 hover:bg-blue-600 dark:hover:bg-blue-600 hover:text-white text-[10px] font-black uppercase tracking-[0.2em] transition-all duration-500 shadow-md active:scale-[0.98]"
                                                >
                                                    {generating === cert.event_id ? (
                                                        <>
                                                            <Loader2 className="h-3.5 w-3.5 mr-2 animate-spin" />
                                                            Generating...
                                                        </>
                                                    ) : (
                                                        <>
                                                            Issue E-Certificate
                                                            <Award className="h-3.5 w-3.5 ml-2 group-hover:scale-110 transition-transform" />
                                                        </>
                                                    )}
                                                </Button>
                                            ) : (
                                                <Button 
                                                    variant="outline"
                                                    asChild
                                                    className="w-full h-10 rounded-lg border-slate-200 dark:border-white/10 text-[10px] font-black uppercase tracking-[0.2em] transition-all duration-500 active:scale-[0.98]"
                                                >
                                                    <Link href="/student-dashboard">
                                                        Complete Evaluation
                                                        <ArrowRight className="h-3.5 w-3.5 ml-2 group-hover:translate-x-1 transition-transform" />
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
                                <div className="h-9 w-9 rounded-lg bg-slate-600/10 flex items-center justify-center border border-slate-600/20 shadow-inner">
                                    <Download className="h-4.5 w-4.5 text-slate-600" />
                                </div>
                                <div>
                                    <h2 className="text-base font-black uppercase tracking-wider text-slate-900 dark:text-white">Earned Certificates</h2>
                                    <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em] mt-0.5">Your official academic collection</p>
                                </div>
                            </div>
                        </div>

                        <div className="relative group">
                            <div className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none">
                                <Search className="h-4 w-4 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
                            </div>
                            <Input 
                                type="text"
                                placeholder="Search by title, event, or certificate number..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="h-12 w-full pl-11 rounded-2xl bg-white dark:bg-slate-900/40 border-slate-200 dark:border-white/5 focus:ring-blue-500/20 shadow-sm text-sm"
                            />
                        </div>
                    </div>

                    {filteredCertificates.length === 0 ? (
                        <Card className="border-none bg-white/80 dark:bg-slate-900/40 backdrop-blur-xl shadow-lg rounded-2xl overflow-hidden group/empty">
                            <CardContent className="py-20 text-center relative">
                                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] h-[300px] bg-blue-500/5 rounded-full blur-[80px] group-hover/empty:scale-110 transition-transform duration-1000" />
                                
                                <div className="relative z-10">
                                    <div className="relative mx-auto w-24 h-24 mb-6">
                                        <div className="absolute inset-0 bg-blue-100 dark:bg-blue-900/20 rounded-full animate-ping opacity-10" />
                                        <div className="relative h-full w-full rounded-full bg-slate-50 dark:bg-slate-800/50 flex items-center justify-center border-4 border-white dark:border-slate-700/50 shadow-xl">
                                            <Award className="h-10 w-10 text-slate-300 dark:text-slate-600" />
                                        </div>
                                    </div>
                                    <div className="max-w-md mx-auto space-y-2">
                                        <h3 className="text-xl font-black text-slate-900 dark:text-white tracking-tight uppercase tracking-wider">
                                            {searchTerm ? 'No matches found' : 'No certificates yet'}
                                        </h3>
                                        <p className="text-xs font-medium text-slate-500 dark:text-slate-400 leading-relaxed px-6">
                                            {searchTerm 
                                                ? `We couldn't find any certificates matching "${searchTerm}". Try a different keyword.`
                                                : "Complete event attendance and evaluations to receive your official certificates here."
                                            }
                                        </p>
                                        {!searchTerm && (
                                            <div className="pt-6">
                                                <Button asChild className="rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-[9px] font-black uppercase tracking-[0.2em] h-9 px-8 shadow-md shadow-blue-500/20 transition-all active:scale-95">
                                                    <Link href="/student-dashboard">Explore Events</Link>
                                                </Button>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                            {filteredCertificates.map((certificate) => (
                                <Card key={certificate.id} className="group relative overflow-hidden rounded-2xl border-none bg-white dark:bg-slate-900/40 backdrop-blur-xl shadow-lg transition-all duration-500 hover:shadow-blue-500/10 hover:-translate-y-1.5">
                                    {/* Accent Top Border */}
                                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-600 to-indigo-600 opacity-40 group-hover:opacity-100 transition-opacity" />
                                    
                                    <CardContent className="p-6">
                                        <div className="flex flex-col h-full">
                                            <div className="flex items-start justify-between gap-4 mb-4">
                                                <div className="h-12 w-12 shrink-0 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/5 flex items-center justify-center text-blue-600 shadow-inner group-hover:scale-110 group-hover:rotate-3 transition-all duration-700">
                                                    <Award className="h-6 w-6" />
                                                </div>
                                                <Badge className={cn(
                                                    "rounded-lg font-black text-[8px] uppercase tracking-[0.2em] px-2 py-0.5",
                                                    certificate.is_downloaded 
                                                        ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20"
                                                        : "bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20"
                                                )}>
                                                    {certificate.is_downloaded ? 'Downloaded' : 'Ready'}
                                                </Badge>
                                            </div>

                                            <div className="space-y-1.5 mb-6 flex-1">
                                                <h3 className="text-base font-black text-slate-900 dark:text-white leading-tight line-clamp-2 group-hover:text-blue-600 transition-colors tracking-tight">
                                                    {certificate.title}
                                                </h3>
                                                <div className="flex flex-col gap-1">
                                                    <div className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400">
                                                        <Calendar className="h-3 w-3" />
                                                        <span className="text-[10px] font-bold uppercase tracking-widest">{certificate.event_name}</span>
                                                    </div>
                                                    <div className="flex items-center gap-1.5 text-slate-400">
                                                        <Fingerprint className="h-3 w-3" />
                                                        <span className="text-[9px] font-medium tracking-tighter">#{certificate.certificate_number}</span>
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="pt-4 border-t border-slate-100 dark:border-white/5 flex items-center justify-between gap-3">
                                                <Button 
                                                    variant="outline" 
                                                    size="sm"
                                                    onClick={() => openCertificate(certificate)}
                                                    className="flex-1 h-9 rounded-lg border-slate-200 dark:border-white/10 text-[9px] font-black uppercase tracking-widest hover:bg-slate-50 dark:hover:bg-white/5 transition-all"
                                                >
                                                    <Eye className="h-3.5 w-3.5 mr-1.5" />
                                                    Preview
                                                </Button>
                                                <Button 
                                                    size="sm"
                                                    disabled={downloading === certificate.id}
                                                    onClick={() => downloadCertificate(certificate.id)}
                                                    className="flex-1 h-9 rounded-lg bg-slate-900 dark:bg-white text-white dark:text-slate-900 hover:bg-blue-600 dark:hover:bg-blue-600 hover:text-white text-[9px] font-black uppercase tracking-widest shadow-md transition-all active:scale-95"
                                                >
                                                    {downloading === certificate.id ? (
                                                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                                    ) : (
                                                        <>
                                                            <Download className="h-3.5 w-3.5 mr-1.5" />
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
                </div>
            </AppShell>
            
            <Dialog open={showDetails} onOpenChange={setShowDetails}>
                <DialogContent className="fixed left-[50%] top-[50%] z-50 w-[95vw] sm:max-w-[825px] translate-x-[-50%] translate-y-[-50%] border bg-white p-6 shadow-2xl duration-200 sm:rounded-xl overflow-hidden">
                    
                    {/* Header Controls */}
                    <div className="flex items-center justify-between pb-3 mb-4 border-b border-gray-100 print:hidden">
                        <div>
                            <h3 className="text-lg font-bold text-slate-900">Certificate Details</h3>
                            <p className="text-xs text-slate-500">View, print, or download your evaluation completion certificate.</p>
                        </div>
                    </div>

                    {selectedCertificate && (
                        <div className="certificate-print-area w-full bg-[#0d1e36] p-4 rounded-lg flex items-center justify-center print:bg-white print:p-0 print:rounded-none">
                            {/* Outer Frame Box Container */}
                            <div className="relative aspect-[1.414/1] w-full max-w-[880px] bg-white p-5 border-[14px] border-[#0c2340] print:border-[12px] shadow-xl rounded-none print:shadow-none">
                                
                                {/* Inner Accent Border Line */}
                                <div className="h-full w-full border-[2px] border-[#c5a059] p-5 relative flex flex-col justify-between">
                                    
                                    {/* Watermark Logo Background Layer */}
                                    <div className="pointer-events-none absolute inset-0 flex items-center justify-center opacity-[0.03]">
                                        <img src="/images/SRCB.png" alt="" className="h-64 w-64 object-contain" />
                                    </div>

                                    {/* Top Institutional Heading Frame */}
                                    <div className="flex items-center justify-between relative z-10">
                                        <div className="flex items-center space-x-3.5">
                                            <img src="/images/SRCB.png" alt="School logo" className="h-12 w-12 object-contain" />
                                            <div>
                                                <h4 className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#0c2340]">
                                                    St. Rita's College of Balingasag
                                                </h4>
                                                <p className="text-[8px] font-semibold uppercase tracking-[0.12em] text-slate-500 mt-0.5">
                                                    Department of Student Affairs
                                                </p>
                                            </div>
                                        </div>
                                        <img src="/images/DSA.png" alt="DSA logo" className="h-12 w-12 rounded-full object-cover ring-2 ring-slate-100 shadow-sm" />
                                    </div>

                                    {/* Badge Certificate Context Type Row */}
                                    <div className="text-center my-0.5 relative z-10 flex items-center justify-center gap-3">
                                        <div className="h-[1px] w-12 bg-[#c5a059]/60" />
                                        <span className="text-[8px] font-extrabold uppercase tracking-[0.25em] text-[#0c2340]">
                                            EVALUATION COMPLETION
                                        </span>
                                        <div className="h-[1px] w-12 bg-[#c5a059]/60" />
                                    </div>

                                    {/* Main Component Presentation Titles */}
                                    <div className="text-center my-0.5 relative z-10">
                                        <h2 className="font-serif text-[34px] font-bold tracking-wide text-[#0c2340] leading-none">
                                            CERTIFICATE
                                        </h2>
                                        <p className="font-serif text-[16px] italic text-[#b38f43] mt-0.5">
                                            of Evaluation Completion
                                        </p>
                                    </div>

                                    {/* Nominated Recipient Context Text Layout block */}
                                    <div className="text-center my-1 relative z-10 max-w-[85%] mx-auto">
                                        <p className="text-[8px] uppercase tracking-[0.16em] text-slate-400 font-medium mb-0.5">
                                            THIS CERTIFICATE IS PROUDLY PRESENTED TO
                                        </p>
                                        <h1 className="font-serif text-[24px] font-bold text-[#0c2340] border-b border-[#c5a059] pb-1 px-4 inline-block min-w-[70%]">
                                            {selectedCertificate.student_name || props.student.name}
                                        </h1>
                                        <p className="text-[10px] leading-relaxed text-slate-600 mt-2 font-normal">
                                            for successfully completing the event evaluation for <span className="font-bold text-slate-900">{selectedCertificate.event_name}</span>. This certificate serves as official proof of evaluation completion.
                                        </p>
                                    </div>

                                    {/* Detailed Badge Metrics Meta Grid */}
                                    <div className="my-2 relative z-10">
                                        <div className="grid grid-cols-6 rounded-xl border border-slate-200/80 bg-slate-50/50 p-2 shadow-sm text-center">
                                            <div className="flex flex-col items-center justify-center px-1">
                                                <Fingerprint className="h-3.5 w-3.5 text-[#b38f43] mb-0.5" />
                                                <div className="text-[6.5px] font-bold uppercase tracking-wider text-slate-400">Certificate Number</div>
                                                <div className="mt-0.5 font-bold text-slate-800 text-[8px] tracking-tight">{selectedCertificate.certificate_number}</div>
                                            </div>
                                            <div className="flex flex-col items-center justify-center px-1 border-l border-slate-200">
                                                <UserSquare2 className="h-3.5 w-3.5 text-[#b38f43] mb-0.5" />
                                                <div className="text-[6.5px] font-bold uppercase tracking-wider text-slate-400">Student ID</div>
                                                <div className="mt-0.5 font-bold text-slate-800 text-[8px]">{selectedCertificate.student_id || props.student.student_id}</div>
                                            </div>
                                            <div className="flex flex-col items-center justify-center px-1 border-l border-slate-200">
                                                <CalendarDays className="h-3.5 w-3.5 text-[#b38f43] mb-0.5" />
                                                <div className="text-[6.5px] font-bold uppercase tracking-wider text-slate-400">Event Date</div>
                                                <div className="mt-0.5 font-bold text-slate-800 text-[8px]">{selectedCertificate.event_date || 'N/A'}</div>
                                            </div>
                                            <div className="flex flex-col items-center justify-center px-1 border-l border-slate-200">
                                                <CalendarCheck2 className="h-3.5 w-3.5 text-[#b38f43] mb-0.5" />
                                                <div className="text-[6.5px] font-bold uppercase tracking-wider text-slate-400">Issue Date</div>
                                                <div className="mt-0.5 font-bold text-slate-800 text-[8px]">{selectedCertificate.issue_date}</div>
                                            </div>
                                            <div className="flex flex-col items-center justify-center px-1 border-l border-slate-200">
                                                <ShieldCheck className="h-3.5 w-3.5 text-[#b38f43] mb-0.5" />
                                                <div className="text-[6.5px] font-bold uppercase tracking-wider text-slate-400">Issued By</div>
                                                <div className="mt-0.5 font-bold text-slate-800 text-[7.5px] leading-tight max-w-[90%]">{selectedCertificate.issued_by}</div>
                                            </div>
                                            <div className="flex flex-col items-center justify-center px-1 border-l border-slate-200">
                                                <FileSpreadsheet className="h-3.5 w-3.5 text-[#b38f43] mb-0.5" />
                                                <div className="text-[6.5px] font-bold uppercase tracking-wider text-slate-400">Certificate Type</div>
                                                <div className="mt-0.5 font-bold text-slate-800 text-[7.5px] leading-tight">{selectedCertificate.certificate_type.replace('_', ' ')}</div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Signatures & Decorative Medal Base Row Layout */}
                                    <div className="mt-2 flex items-center justify-between relative z-10 px-6">
                                        
                                        {/* 1. Left Column: Ribbon Wrapper */}
                                        <div className="w-[180px] flex items-center justify-start relative">
                                            <div className="relative flex flex-col items-center justify-center -mt-4">
                                                <div className="w-11 h-11 bg-gradient-to-br from-[#dfba6b] via-[#c5a059] to-[#ac843b] rounded-full flex items-center justify-center shadow-md border-2 border-white ring-1 ring-[#c5a059] z-20">
                                                    <Award className="h-5.5 w-5.5 text-white" />
                                                </div>
                                                {/* Ribbon Tails */}
                                                <div className="absolute top-7 flex space-x-1.5 z-10">
                                                    <div className="w-2.5 h-8 bg-[#ac843b] clip-ribbon transform -rotate-12 origin-top" />
                                                    <div className="w-2.5 h-8 bg-[#8c6621] clip-ribbon transform rotate-12 origin-top" />
                                                </div>
                                            </div>
                                        </div>

                                        {/* 2. Center Column: Signature Wrapper */}
                                        <div className="flex-1 flex flex-col items-center justify-center text-center">
                                            <div className="text-[10px] font-bold text-slate-900 border-b border-slate-400/80 pb-1 px-4 inline-block min-w-[200px]">
                                                {selectedCertificate.signature_name}
                                            </div>
                                            <div className="text-[7.5px] font-bold text-slate-800 mt-1">
                                                Dean of Student Affairs
                                            </div>
                                        </div>

                                        {/* 3. Right Column: Balance Spacer */}
                                        <div className="w-[180px] shrink-0" aria-hidden="true"></div>
                                    </div>

                                    {/* Bottom Verification Footer Tag */}
                                    <div className="mt-2 flex items-center justify-between text-[6.5px] uppercase tracking-[0.15em] text-slate-400 font-semibold border-t border-slate-100 pt-1">
                                        <span>Verified through DSAMS</span>
                                        <span>{selectedCertificate.certificate_number}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Modal Controls Actions Bar */}
                    {selectedCertificate && (
                        <div className="flex justify-end gap-2.5 mt-4 pt-3 border-t border-gray-100 print:hidden">
                            <Button 
                                variant="outline"
                                onClick={printCertificate} 
                                className="gap-2 text-slate-700 hover:text-slate-900 border-slate-200"
                            >
                                <Printer className="h-4 w-4" />
                                Print
                            </Button>
                            
                            <Button 
                                onClick={() => downloadCertificate(selectedCertificate.id)}
                                disabled={downloading === selectedCertificate.id}
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

function Detail({ label, value, wide = false }: { label: string; value?: string; wide?: boolean }) {
    return (
        <div className={wide ? 'sm:col-span-2' : undefined}>
            <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</div>
            <div className="mt-1 font-medium text-slate-900">{value || 'N/A'}</div>
        </div>
    );
}
