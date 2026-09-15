import { Link } from '@inertiajs/react';
import { useState, useEffect } from 'react';
import {
    ArrowUp,
    ChevronRight,
    Facebook,
    Instagram,
    Mail,
    MapPin,
    Phone,
    ShieldCheck,
    FileText,
    X,
    Youtube,
    Compass,
} from 'lucide-react';

export default function LandingFooter() {
    const [isVisible, setIsVisible] = useState(false);
    const [policyModal, setPolicyModal] = useState<'privacy' | 'terms' | null>(
        null,
    );

    useEffect(() => {
        const toggleVisibility = () => {
            if (window.scrollY > 300) {
                setIsVisible(true);
            } else {
                setIsVisible(false);
            }
        };

        window.addEventListener('scroll', toggleVisibility);
        return () => window.removeEventListener('scroll', toggleVisibility);
    }, []);

    const scrollToTop = () => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const quickLinks = [
        { label: 'Home', href: '/#home' },
        { label: 'About OSAMS', href: '/about' },
        { label: 'Mission & Vision', href: '/#mission' },
        { label: 'Services & Features', href: '/features' },
        { label: 'Help & FAQs', href: '/help' },
        { label: 'System Sitemap', href: '/sitemap', isHighlighted: true },
        { label: 'Portal Sign In', href: '/login' },
    ];

    return (
        <>
            <footer
                id="contact"
                className="relative overflow-hidden bg-[#000D6A] text-white"
            >
                {/* Background Pattern */}
                <div className="absolute inset-0 opacity-[0.03]">
                    <div
                        className="absolute inset-0"
                        style={{
                            backgroundImage: `radial-gradient(circle at 25% 25%, #23509A 1px, transparent 1px), radial-gradient(circle at 75% 75%, #FBFBFB 1px, transparent 1px)`,
                            backgroundSize: '30px 30px',
                        }}
                    />
                </div>

                <div className="relative">
                    <div className="mx-auto max-w-7xl px-4 py-12 sm:py-16 lg:px-8">
                        <div className="grid gap-8 sm:gap-10 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
                            {/* Brand Section */}
                            <div className="space-y-4 sm:space-y-6">
                                <div className="flex items-center gap-3">
                                    <div className="flex h-10 w-10 sm:h-12 sm:w-12 items-center justify-center rounded-xl bg-[#23509A] shrink-0 shadow-md">
                                        <img
                                            src="/images/DSA.png"
                                            alt="Dean of Student Affairs"
                                            className="h-6 w-6 sm:h-7 sm:w-7 rounded object-cover"
                                        />
                                    </div>
                                    <div>
                                        <div className="text-base sm:text-lg font-bold text-white tracking-wide">
                                            OSAMS
                                        </div>
                                        <div className="text-xs sm:text-sm text-blue-300">
                                            Management System
                                        </div>
                                    </div>
                                </div>

                                <p className="text-xs sm:text-sm leading-relaxed text-white/80">
                                    Office of Student Affairs & Services –
                                    Nurturing Faith, Passion for Excellence &
                                    Commitment for Humble Service at St. Rita's
                                    College of Balingasag.
                                </p>

                                <div className="flex items-center gap-3 sm:gap-4">
                                    <a
                                        href="https://www.facebook.com/srcbofficial"
                                        target="_blank"
                                        rel="noreferrer"
                                        className="flex h-9 w-9 sm:h-10 sm:w-10 items-center justify-center rounded-lg bg-white/10 text-white transition-all duration-200 hover:bg-[#23509A] hover:scale-105"
                                        aria-label="Facebook"
                                    >
                                        <Facebook className="h-4 w-4 sm:h-5 sm:w-5" />
                                    </a>
                                    <a
                                        href="https://www.youtube.com/@St.RitasCollegeBalingasag"
                                        target="_blank"
                                        rel="noreferrer"
                                        className="flex h-9 w-9 sm:h-10 sm:w-10 items-center justify-center rounded-lg bg-white/10 text-white transition-all duration-200 hover:bg-[#23509A] hover:scale-105"
                                        aria-label="YouTube"
                                    >
                                        <Youtube className="h-4 w-4 sm:h-5 sm:w-5" />
                                    </a>
                                    <a
                                        href="mailto:ritarian@srcb.edu.ph"
                                        className="flex h-9 w-9 sm:h-10 sm:w-10 items-center justify-center rounded-lg bg-white/10 text-white transition-all duration-200 hover:bg-[#23509A] hover:scale-105"
                                        aria-label="Email"
                                    >
                                        <Mail className="h-4 w-4 sm:h-5 sm:w-5" />
                                    </a>
                                </div>
                            </div>

                            {/* Quick Links */}
                            <div className="space-y-4 sm:space-y-6">
                                <div className="flex items-center gap-2">
                                    <h4 className="text-base sm:text-lg font-semibold text-white">
                                        Quick Links
                                    </h4>
                                    <span className="rounded bg-blue-500/20 px-2 py-0.5 text-[10px] font-bold text-[#8CE4FF]">
                                        Directory
                                    </span>
                                </div>
                                <nav className="grid grid-cols-1 gap-2 text-xs sm:text-sm">
                                    {quickLinks.map((link, idx) => (
                                        <Link
                                            key={idx}
                                            href={link.href}
                                            className={`group flex items-center gap-1.5 transition-all duration-200 hover:translate-x-1 ${
                                                link.isHighlighted
                                                    ? 'font-medium text-[#8CE4FF] hover:text-white'
                                                    : 'text-white/80 hover:text-[#8CE4FF]'
                                            }`}
                                        >
                                            <ChevronRight className="h-3 w-3 text-[#8CE4FF]/60 transition-transform duration-200 group-hover:translate-x-0.5 group-hover:text-[#8CE4FF]" />
                                            <span>{link.label}</span>
                                            {link.isHighlighted && (
                                                <span className="ml-1 rounded bg-[#8CE4FF]/20 px-1.5 py-0.2 text-[9px] font-bold uppercase tracking-wider text-[#8CE4FF]">
                                                    New
                                                </span>
                                            )}
                                        </Link>
                                    ))}
                                </nav>
                            </div>

                            {/* Contact Info */}
                            <div className="space-y-4 sm:space-y-6">
                                <h4 className="text-base sm:text-lg font-semibold text-white">
                                    Contact Information
                                </h4>
                                <div className="space-y-3 sm:space-y-4 text-xs sm:text-sm">
                                    <div className="flex items-start gap-2.5 sm:gap-3">
                                        <Phone className="mt-0.5 h-4 w-4 sm:h-5 sm:w-5 flex-shrink-0 text-[#8CE4FF]" />
                                        <div className="text-white/80">
                                            <div className="mb-0.5 text-xs font-semibold text-white">
                                                Mobile Phone:
                                            </div>
                                            <div>0929-734-0012 (SMART)</div>
                                            <div>0953-280-2090 (TM)</div>
                                        </div>
                                    </div>

                                    <div className="flex items-start gap-2.5 sm:gap-3">
                                        <Phone className="mt-0.5 h-4 w-4 sm:h-5 sm:w-5 flex-shrink-0 text-[#8CE4FF]" />
                                        <div className="text-white/80">
                                            <div className="mb-0.5 text-xs font-semibold text-white">
                                                Telephone:
                                            </div>
                                            <div>(088) 323-7159</div>
                                        </div>
                                    </div>

                                    <div className="flex items-start gap-2.5 sm:gap-3">
                                        <Mail className="mt-0.5 h-4 w-4 sm:h-5 sm:w-5 flex-shrink-0 text-[#8CE4FF]" />
                                        <div className="text-white/80">
                                            <div className="mb-0.5 text-xs font-semibold text-white">
                                                Email:
                                            </div>
                                            <div className="break-all">
                                                ritarian@srcb.edu.ph
                                            </div>
                                            <div className="break-all">
                                                heddsa@srcb.edu.ph
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex items-start gap-2.5 sm:gap-3">
                                        <MapPin className="mt-0.5 h-4 w-4 sm:h-5 sm:w-5 flex-shrink-0 text-[#8CE4FF]" />
                                        <div className="text-white/80">
                                            <div className="mb-0.5 text-xs font-semibold text-white">
                                                Address:
                                            </div>
                                            <div>
                                                St. Rita's College of Balingasag,
                                                Balingasag, Misamis Oriental,
                                                9005 Philippines
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Location Map */}
                            <div className="space-y-4 sm:space-y-6">
                                <h4 className="text-base sm:text-lg font-semibold text-white">
                                    Our Location
                                </h4>
                                <div className="overflow-hidden rounded-xl border border-white/20 bg-white/10 backdrop-blur-sm shadow-md">
                                    <iframe
                                        title="Map"
                                        className="h-40 sm:h-48 w-full"
                                        loading="lazy"
                                        referrerPolicy="no-referrer-when-downgrade"
                                        src="https://www.google.com/maps?q=St.%20Rita%27s%20College%20of%20Balingasag&output=embed"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Bottom Section */}
                    <div className="mt-8 sm:mt-12 border-t border-white/10 pt-6 sm:pt-8 pb-10 sm:pb-12">
                        <div className="mx-auto max-w-7xl px-4 lg:px-8">
                            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-left">
                                <div className="text-xs sm:text-sm text-white/70">
                                    © {new Date().getFullYear()} OSAMS – Office
                                    of the Student Affairs Management System.
                                    All rights reserved.
                                </div>

                                <div className="flex flex-wrap items-center justify-center gap-4 sm:gap-6 text-xs sm:text-sm text-white/70">
                                    <button
                                        type="button"
                                        onClick={() =>
                                            setPolicyModal('privacy')
                                        }
                                        className="transition-colors duration-200 hover:text-[#8CE4FF] underline-offset-4 hover:underline"
                                    >
                                        Privacy Policy
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setPolicyModal('terms')}
                                        className="transition-colors duration-200 hover:text-[#8CE4FF] underline-offset-4 hover:underline"
                                    >
                                        Terms of Service
                                    </button>
                                    <Link
                                        href="/sitemap"
                                        className="flex items-center gap-1 transition-colors duration-200 hover:text-[#8CE4FF] underline-offset-4 hover:underline"
                                    >
                                        <Compass className="h-3.5 w-3.5 text-[#8CE4FF]" />
                                        <span>Sitemap</span>
                                    </Link>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Floating Scroll to Top Button */}
                <button
                    onClick={scrollToTop}
                    className={`fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-50 flex h-10 w-10 sm:h-12 sm:w-12 items-center justify-center rounded-full bg-[#23509A] text-white shadow-2xl ring-2 ring-white/10 transition-all duration-300 hover:scale-110 hover:bg-white hover:text-[#23509A] ${
                        isVisible
                            ? 'translate-y-0 opacity-100 pointer-events-auto'
                            : 'translate-y-8 opacity-0 pointer-events-none'
                    }`}
                    aria-label="Scroll to top"
                >
                    <ArrowUp className="h-4 w-4 sm:h-5 sm:w-5" />
                </button>
            </footer>

            {/* Privacy Policy & Terms Modal */}
            {policyModal && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
                    <div className="relative max-h-[85vh] w-full max-w-2xl overflow-y-auto rounded-3xl bg-white p-6 sm:p-8 text-slate-900 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-200">
                        <button
                            onClick={() => setPolicyModal(null)}
                            className="absolute right-5 top-5 rounded-full bg-slate-100 p-2 text-slate-500 hover:bg-slate-200 hover:text-slate-800 transition-colors"
                        >
                            <X className="h-5 w-5" />
                        </button>

                        {policyModal === 'privacy' ? (
                            <div>
                                <div className="flex items-center gap-3 mb-4">
                                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-100 text-[#23509A]">
                                        <ShieldCheck className="h-5 w-5" />
                                    </div>
                                    <div>
                                        <h3 className="text-xl font-bold text-slate-900">
                                            Data Privacy Policy
                                        </h3>
                                        <p className="text-xs text-slate-500">
                                            Republic Act No. 10173 (Data Privacy
                                            Act of 2012)
                                        </p>
                                    </div>
                                </div>

                                <div className="space-y-4 text-xs sm:text-sm text-slate-600 leading-relaxed max-h-[55vh] overflow-y-auto pr-2">
                                    <p>
                                        The Office of Student Affairs and
                                        Services (OSAMS) at St. Rita's College
                                        of Balingasag commits to protecting and
                                        respecting the privacy of all students,
                                        faculty, staff, and institutional
                                        stakeholders.
                                    </p>
                                    <h4 className="font-bold text-slate-900 pt-2">
                                        1. Collection of Information
                                    </h4>
                                    <p>
                                        We collect student profile credentials,
                                        institutional student numbers, contact
                                        information, event attendance timestamps,
                                        dynamic QR check-in records, and medical
                                        clearance documents strictly for
                                        academic management, attendance
                                        monitoring, and student service
                                        fulfillment.
                                    </p>
                                    <h4 className="font-bold text-slate-900 pt-2">
                                        2. Use and Processing
                                    </h4>
                                    <p>
                                        Collected personal information is
                                        processed exclusively to facilitate
                                        re-admission clearance approvals,
                                        validate event participation for
                                        certificates, monitor handbook
                                        compliance, and generate certified
                                        departmental reports.
                                    </p>
                                    <h4 className="font-bold text-slate-900 pt-2">
                                        3. Confidentiality and Retention
                                    </h4>
                                    <p>
                                        Student records are stored in secure
                                        encrypted databases with strict
                                        role-based access controls. Data is
                                        retained in accordance with Commission
                                        on Higher Education (CHED) standards
                                        and school archival schedules.
                                    </p>
                                </div>

                                <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between">
                                    <Link
                                        href="/sitemap"
                                        onClick={() => setPolicyModal(null)}
                                        className="text-xs font-semibold text-[#23509A] hover:underline"
                                    >
                                        View in System Sitemap &rarr;
                                    </Link>
                                    <button
                                        onClick={() => setPolicyModal(null)}
                                        className="rounded-xl bg-[#23509A] px-5 py-2 text-xs font-bold text-white shadow hover:bg-[#000D6A] transition-all"
                                    >
                                        I Understand
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <div>
                                <div className="flex items-center gap-3 mb-4">
                                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-100 text-indigo-700">
                                        <FileText className="h-5 w-5" />
                                    </div>
                                    <div>
                                        <h3 className="text-xl font-bold text-slate-900">
                                            Terms of Service
                                        </h3>
                                        <p className="text-xs text-slate-500">
                                            OSAMS System Terms & Student Code of
                                            Conduct
                                        </p>
                                    </div>
                                </div>

                                <div className="space-y-4 text-xs sm:text-sm text-slate-600 leading-relaxed max-h-[55vh] overflow-y-auto pr-2">
                                    <p>
                                        By accessing or using the OSAMS digital
                                        platform, you agree to comply with the
                                        policies, academic guidelines, and
                                        student handbook of St. Rita's College
                                        of Balingasag.
                                    </p>
                                    <h4 className="font-bold text-slate-900 pt-2">
                                        1. Authorized Account Access
                                    </h4>
                                    <p>
                                        Each user is responsible for maintaining
                                        the confidentiality of their portal
                                        credentials. Sharing account access,
                                        impersonating other students, or
                                        circumventing dynamic QR attendance
                                        geofences constitutes a grave disciplinary
                                        infraction.
                                    </p>
                                    <h4 className="font-bold text-slate-900 pt-2">
                                        2. Authenticity of Clearance Documents
                                    </h4>
                                    <p>
                                        All submitted excuse letters, medical
                                        certificates, and justification notices
                                        for Admission Slip issuance must be
                                        truthful. Uploading forged or falsified
                                        documents will trigger immediate student
                                        disciplinary action.
                                    </p>
                                    <h4 className="font-bold text-slate-900 pt-2">
                                        3. System Integrity & Misuse
                                    </h4>
                                    <p>
                                        Attempting unauthorized access to
                                        administrative consoles, tampering with
                                        database records, or disrupting
                                        attendance scanner portals will result
                                        in account termination and formal legal
                                        or academic sanctions.
                                    </p>
                                </div>

                                <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between">
                                    <Link
                                        href="/sitemap"
                                        onClick={() => setPolicyModal(null)}
                                        className="text-xs font-semibold text-[#23509A] hover:underline"
                                    >
                                        View in System Sitemap &rarr;
                                    </Link>
                                    <button
                                        onClick={() => setPolicyModal(null)}
                                        className="rounded-xl bg-[#23509A] px-5 py-2 text-xs font-bold text-white shadow hover:bg-[#000D6A] transition-all"
                                    >
                                        I Agree
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </>
    );
}
