import LandingFooter from '@/components/landing/landing-footer';
import LandingNavbar from '@/components/landing/landing-navbar';
import type { SharedData } from '@/types';
import { Head, Link, usePage } from '@inertiajs/react';
import {
    AlertOctagon,
    AlertTriangle,
    ArrowLeft,
    Award,
    Building2,
    Calendar,
    CheckCircle2,
    Clock,
    FileCheck,
    FileText,
    Gavel,
    HelpCircle,
    Info,
    Lock,
    Mail,
    MapPin,
    QrCode,
    Scale,
    Shield,
    ShieldAlert,
    ShieldCheck,
    Smartphone,
    UserCheck,
    Users,
} from 'lucide-react';
import { useState } from 'react';

const SECTIONS = [
    { id: 'acceptance', title: '1. Acceptance & Student Code', icon: Scale },
    { id: 'accounts', title: '2. Account Security & Credentials', icon: Lock },
    { id: 'attendance', title: '3. QR & Attendance Integrity', icon: QrCode },
    { id: 'clearances', title: '4. Admission Slips & Proof', icon: FileCheck },
    { id: 'discipline', title: '5. Summons, Appeals & Due Process', icon: Gavel },
    { id: 'security', title: '6. System Security & Misuse', icon: ShieldAlert },
    { id: 'governing-law', title: '7. Revisions & Governing Law', icon: Building2 },
];

export default function TermsOfServicePage() {
    const { auth } = usePage<SharedData>().props;
    const [activeSection, setActiveSection] = useState('acceptance');

    const scrollTo = (id: string) => {
        setActiveSection(id);
        const el = document.getElementById(id);
        if (el) {
            el.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    };

    return (
        <>
            <Head title="Terms of Service – OSAMS" />
            <div className="min-h-screen bg-[#FAFAFA] text-slate-900 selection:bg-blue-600 selection:text-white">
                <LandingNavbar isAuthed={!!auth?.user} />

                {/* ── Hero Header ────────────────────────────────────────── */}
                <section className="relative overflow-hidden bg-gradient-to-b from-[#000D6A] via-[#0B2D66] to-[#12397B] pt-24 pb-8 sm:pt-28 sm:pb-10 md:pt-32 md:pb-12 text-white">
                    <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff0a_1px,transparent_1px),linear-gradient(to_bottom,#ffffff0a_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none" />
                    <div className="absolute top-0 right-1/4 h-64 w-64 rounded-full bg-blue-500/15 blur-[80px] pointer-events-none" />

                    <div className="relative z-10 mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 text-center">
                        <div className="flex items-center justify-center gap-2 mb-3">
                            <Link
                                href="/"
                                className="inline-flex items-center gap-1.5 rounded-lg border border-white/20 bg-white/10 px-2.5 py-1 text-xs font-semibold text-white backdrop-blur-md hover:bg-white/20 active:scale-95 transition-all shadow-sm"
                            >
                                <ArrowLeft className="h-3.5 w-3.5" />
                                Back to Home
                            </Link>
                            <div className="inline-flex items-center gap-1.5 rounded-full border border-blue-400/30 bg-white/10 px-2.5 py-1 text-[11px] font-semibold tracking-wider text-blue-200 uppercase backdrop-blur-md shadow-sm">
                                <FileText className="h-3.5 w-3.5 text-blue-300 animate-pulse" />
                                Official Institutional Agreement
                            </div>
                        </div>

                        <h1 className="text-xl sm:text-2xl md:text-3xl font-bold tracking-tight text-white mb-2">
                            Terms of Service & Student Agreement
                        </h1>

                        <p className="mx-auto max-w-2xl text-xs sm:text-sm text-blue-100/90 leading-relaxed font-normal">
                            Terms governing access and use of the Office of Student Affairs and Services Management System (OSAMS) at St. Rita's College of Balingasag.
                        </p>

                        <div className="mt-3 flex flex-wrap items-center justify-center gap-4 text-[11px] text-blue-200 font-medium">
                            <span className="flex items-center gap-1">
                                <Calendar className="h-3.5 w-3.5 text-blue-300" />
                                Effective Date: Academic Year 2024–2026
                            </span>
                            <span className="hidden sm:inline">•</span>
                            <span className="flex items-center gap-1">
                                <ShieldCheck className="h-3.5 w-3.5 text-blue-300" />
                                Governing Document: SRCB Student Handbook
                            </span>
                        </div>
                    </div>
                </section>

                {/* ── Main Terms Content ─────────────────────────────────── */}
                <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-12 lg:px-8">
                    <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
                        {/* Sidebar Navigation */}
                        <div className="lg:col-span-4 xl:col-span-3">
                            <div className="sticky top-20 rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm space-y-1">
                                <h3 className="px-3 py-2 text-xs font-black uppercase tracking-wider text-slate-400">
                                    Agreement Sections
                                </h3>
                                <nav className="space-y-1">
                                    {SECTIONS.map((sec) => {
                                        const Icon = sec.icon;
                                        const isSelected = activeSection === sec.id;
                                        return (
                                            <button
                                                key={sec.id}
                                                onClick={() => scrollTo(sec.id)}
                                                className={`flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-left text-xs font-bold transition-all ${
                                                    isSelected
                                                        ? 'bg-[#000D6A] text-white shadow-sm'
                                                        : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                                                }`}
                                            >
                                                <Icon className={`h-4 w-4 shrink-0 ${isSelected ? 'text-blue-300' : 'text-slate-400'}`} />
                                                <span className="truncate">{sec.title}</span>
                                            </button>
                                        );
                                    })}
                                </nav>

                                <div className="mt-4 pt-4 border-t border-slate-100">
                                    <div className="rounded-xl bg-amber-50/80 p-3 text-xs text-slate-600 space-y-1.5">
                                        <div className="flex items-center gap-1 text-amber-800 font-bold">
                                            <AlertTriangle className="h-3.5 w-3.5 text-amber-600" />
                                            <span>Important Notice</span>
                                        </div>
                                        <p className="text-[11px] leading-relaxed text-slate-600">
                                            By logging into OSAMS, students agree to adhere to all guidelines in the official Student Handbook and campus policies.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Content Body */}
                        <div className="lg:col-span-8 xl:col-span-9 space-y-8">
                            {/* SECTION 1 */}
                            <section
                                id="acceptance"
                                className="scroll-mt-24 rounded-2xl border border-slate-200/80 bg-white p-6 sm:p-8 shadow-xs space-y-4"
                            >
                                <div className="flex items-center gap-3">
                                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-[#000D6A]">
                                        <Scale className="h-5 w-5" />
                                    </div>
                                    <div>
                                        <span className="text-[10px] font-bold text-blue-600 uppercase tracking-wider">Section 1</span>
                                        <h2 className="text-lg sm:text-xl font-bold text-slate-900">
                                            Acceptance of Terms & Student Handbook Binding
                                        </h2>
                                    </div>
                                </div>

                                <div className="space-y-3 text-xs sm:text-sm text-slate-600 leading-relaxed">
                                    <p>
                                        By accessing, browsing, registering an account, or scanning QR codes through the <strong>OSAMS platform</strong>, you acknowledge that you have read, understood, and agree to be legally bound by these Terms of Service, the <strong>SRCB Student Handbook</strong>, and institutional academic regulations.
                                    </p>
                                    <p>
                                        If you do not agree with any part of these terms, you must immediately cease use of the portal and consult the Office of Student Affairs for alternative physical processing.
                                    </p>
                                </div>
                            </section>

                            {/* SECTION 2 */}
                            <section
                                id="accounts"
                                className="scroll-mt-24 rounded-2xl border border-slate-200/80 bg-white p-6 sm:p-8 shadow-xs space-y-4"
                            >
                                <div className="flex items-center gap-3">
                                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-indigo-700">
                                        <Lock className="h-5 w-5" />
                                    </div>
                                    <div>
                                        <span className="text-[10px] font-bold text-indigo-600 uppercase tracking-wider">Section 2</span>
                                        <h2 className="text-lg sm:text-xl font-bold text-slate-900">
                                            Authorized User Accounts & Credential Security
                                        </h2>
                                    </div>
                                </div>

                                <div className="space-y-3 text-xs sm:text-sm text-slate-600 leading-relaxed">
                                    <p>
                                        Access to student portal functions is granted exclusively to officially enrolled students of St. Rita's College of Balingasag:
                                    </p>
                                    <ul className="space-y-2 list-disc list-inside text-slate-600 pl-1">
                                        <li><strong>Account Exclusivity:</strong> Each student is assigned one single unified account associated with their official Student ID Number.</li>
                                        <li><strong>Credential Confidentiality:</strong> You are solely responsible for maintaining the confidentiality of your password and authentication tokens.</li>
                                        <li><strong>Prohibition on Account Sharing:</strong> Allowing another student to access your account or "pilot" attendance scans constitutes a major disciplinary infraction under the student handbook.</li>
                                    </ul>
                                </div>
                            </section>

                            {/* SECTION 3 */}
                            <section
                                id="attendance"
                                className="scroll-mt-24 rounded-2xl border border-slate-200/80 bg-white p-6 sm:p-8 shadow-xs space-y-4"
                            >
                                <div className="flex items-center gap-3">
                                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
                                        <QrCode className="h-5 w-5" />
                                    </div>
                                    <div>
                                        <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-wider">Section 3</span>
                                        <h2 className="text-lg sm:text-xl font-bold text-slate-900">
                                            Dynamic QR Scanning & Attendance Geofence Integrity
                                        </h2>
                                    </div>
                                </div>

                                <div className="space-y-3 text-xs sm:text-sm text-slate-600 leading-relaxed">
                                    <p>
                                        The OSAMS attendance engine implements dynamic rotating tokens and strict location checks. The following actions are strictly prohibited:
                                    </p>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
                                        <div className="rounded-xl border border-rose-200 bg-rose-50/50 p-3.5 text-xs text-rose-900 space-y-1">
                                            <strong className="block text-rose-800 font-bold">🚫 Screenshot / Photo Forwarding</strong>
                                            <p className="text-rose-700 leading-relaxed">
                                                Projector QR codes rotate every 30 seconds. Capturing, transmitting, or sharing static screenshots to clock in absent peers is detected and logged as academic dishonesty.
                                            </p>
                                        </div>
                                        <div className="rounded-xl border border-rose-200 bg-rose-50/50 p-3.5 text-xs text-rose-900 space-y-1">
                                            <strong className="block text-rose-800 font-bold">🚫 GPS Mock Location / Spoofing</strong>
                                            <p className="text-rose-700 leading-relaxed">
                                                Using mock location apps, GPS emulators, or VPN tunneling to bypass venue geofencing triggers automated fraud alerts and revokes check-in validity.
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </section>

                            {/* SECTION 4 */}
                            <section
                                id="clearances"
                                className="scroll-mt-24 rounded-2xl border border-slate-200/80 bg-white p-6 sm:p-8 shadow-xs space-y-4"
                            >
                                <div className="flex items-center gap-3">
                                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                                        <FileCheck className="h-5 w-5" />
                                    </div>
                                    <div>
                                        <span className="text-[10px] font-bold text-blue-600 uppercase tracking-wider">Section 4</span>
                                        <h2 className="text-lg sm:text-xl font-bold text-slate-900">
                                            Admission Slips & Authenticity of Clearance Documents
                                        </h2>
                                    </div>
                                </div>

                                <div className="space-y-3 text-xs sm:text-sm text-slate-600 leading-relaxed">
                                    <p>
                                        All submitted electronic requests for Admission Slips must be supported by genuine, verified evidence:
                                    </p>
                                    <ul className="space-y-2 list-disc list-inside text-slate-600 pl-1">
                                        <li><strong>48-Hour Filing Rule:</strong> Excuse slip applications must be submitted within forty-eight (48) hours of returning to campus.</li>
                                        <li><strong>Medical Authenticity:</strong> Medical certificates uploaded to the system are verified directly by the DSA health officers. Submitting forged or edited documents results in immediate suspension proceedings.</li>
                                        <li><strong>Non-Transferable:</strong> Approved electronic admission slips are unique to the applicant student and cannot be transferred or shared.</li>
                                    </ul>
                                </div>
                            </section>

                            {/* SECTION 5 */}
                            <section
                                id="discipline"
                                className="scroll-mt-24 rounded-2xl border border-slate-200/80 bg-white p-6 sm:p-8 shadow-xs space-y-4"
                            >
                                <div className="flex items-center gap-3">
                                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-50 text-amber-600">
                                        <Gavel className="h-5 w-5" />
                                    </div>
                                    <div>
                                        <span className="text-[10px] font-bold text-amber-600 uppercase tracking-wider">Section 5</span>
                                        <h2 className="text-lg sm:text-xl font-bold text-slate-900">
                                            Disciplinary Summons, Calling Slips & Due Process
                                        </h2>
                                    </div>
                                </div>

                                <div className="space-y-3 text-xs sm:text-sm text-slate-600 leading-relaxed">
                                    <p>
                                        When an official Calling Notice or Summons is docketed to your student profile:
                                    </p>
                                    <ul className="space-y-2 list-disc list-inside text-slate-600 pl-1">
                                        <li><strong>Mandatory Appearance:</strong> The student must report in person to the Office of the Dean of Student Affairs on the date and time indicated in the summons.</li>
                                        <li><strong>Due Process & Hearing:</strong> Students have the full right to explain their perspective, present supporting witnesses, and be assisted by their legal guardian or adviser.</li>
                                        <li><strong>Five-Day Appeal Window:</strong> If a formal disciplinary resolution is issued (Step 5), the student has the right to file a written appeal with the Campus Appeals Committee within five (5) school days.</li>
                                    </ul>
                                </div>
                            </section>

                            {/* SECTION 6 */}
                            <section
                                id="security"
                                className="scroll-mt-24 rounded-2xl border border-slate-200/80 bg-white p-6 sm:p-8 shadow-xs space-y-4"
                            >
                                <div className="flex items-center gap-3">
                                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-rose-50 text-rose-600">
                                        <ShieldAlert className="h-5 w-5" />
                                    </div>
                                    <div>
                                        <span className="text-[10px] font-bold text-rose-600 uppercase tracking-wider">Section 6</span>
                                        <h2 className="text-lg sm:text-xl font-bold text-slate-900">
                                            System Security, Integrity & Prohibited Actions
                                        </h2>
                                    </div>
                                </div>

                                <div className="space-y-3 text-xs sm:text-sm text-slate-600 leading-relaxed">
                                    <p>Users must not engage in any activity that impairs system stability, security, or data integrity, including:</p>
                                    <ul className="space-y-2 list-disc list-inside text-slate-600 pl-1">
                                        <li>Attempting unauthorized access to administrative portals, faculty consoles, or other student accounts.</li>
                                        <li>Deploying automated crawlers, bots, or scripts to flood registration queues or disrupt real-time live attendance.</li>
                                        <li>Decompiling, reverse engineering, or exploiting vulnerabilities in the web application or service worker caches.</li>
                                    </ul>
                                </div>
                            </section>

                            {/* SECTION 7 */}
                            <section
                                id="governing-law"
                                className="scroll-mt-24 rounded-2xl border border-slate-200/80 bg-white p-6 sm:p-8 shadow-xs space-y-5"
                            >
                                <div className="flex items-center gap-3">
                                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-[#000D6A]">
                                        <Building2 className="h-5 w-5" />
                                    </div>
                                    <div>
                                        <span className="text-[10px] font-bold text-blue-600 uppercase tracking-wider">Section 7</span>
                                        <h2 className="text-lg sm:text-xl font-bold text-slate-900">
                                            Revisions, Termination & Governing Law
                                        </h2>
                                    </div>
                                </div>

                                <div className="space-y-3 text-xs sm:text-sm text-slate-600 leading-relaxed">
                                    <p>
                                        SRCB reserves the right to amend these terms at the start of each academic semester. Significant modifications are broadcast via system announcements.
                                    </p>
                                    <p>
                                        These Terms are governed by the laws of the Republic of the Philippines, Commission on Higher Education (CHED) regulatory guidelines, and the institutional handbook of St. Rita’s College of Balingasag. Any unresolved legal disputes shall be handled within the jurisdiction of the Regional Trial Court in Misamis Oriental.
                                    </p>
                                </div>

                                {/* Support Office Card */}
                                <div className="rounded-2xl bg-gradient-to-r from-[#000D6A] via-[#0B2D66] to-[#12397B] p-5 sm:p-6 text-white space-y-3">
                                    <div className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-2.5 py-0.5 text-[10px] font-semibold text-blue-200 uppercase tracking-wider">
                                        <Building2 className="h-3 w-3" />
                                        Office of Student Affairs
                                    </div>
                                    <h3 className="text-base sm:text-lg font-bold text-white">
                                        Questions regarding Terms or Disciplinary Guidelines?
                                    </h3>
                                    <p className="text-xs text-blue-100/90 leading-relaxed max-w-xl">
                                        Visit the Student Affairs Office (Ground Floor, Main Campus) or reach out via email at <span className="font-bold text-white underline">dsa@srcb.edu.ph</span>.
                                    </p>
                                </div>
                            </section>
                        </div>
                    </div>
                </main>

                <LandingFooter />
            </div>
        </>
    );
}
