import LandingFooter from '@/components/landing/landing-footer';
import LandingNavbar from '@/components/landing/landing-navbar';
import type { SharedData } from '@/types';
import { Head, Link, usePage } from '@inertiajs/react';
import {
    ArrowLeft,
    Building2,
    Calendar,
    CheckCircle2,
    Clock,
    Database,
    Eye,
    FileCheck,
    FileText,
    HelpCircle,
    Info,
    Lock,
    Mail,
    MapPin,
    Phone,
    QrCode,
    Scale,
    Shield,
    ShieldAlert,
    ShieldCheck,
    UserCheck,
    Users,
} from 'lucide-react';
import { useState } from 'react';

const SECTIONS = [
    { id: 'mandate', title: '1. Legal Mandate & Scope', icon: Scale },
    { id: 'collection', title: '2. Information We Collect', icon: Database },
    { id: 'processing', title: '3. Purpose of Processing', icon: UserCheck },
    { id: 'geotagging', title: '4. GPS & Dynamic QR Security', icon: QrCode },
    { id: 'access-control', title: '5. Access Control & Confidentiality', icon: Lock },
    { id: 'retention', title: '6. Storage, Encryption & Retention', icon: ShieldCheck },
    { id: 'rights', title: '7. Student Data Rights & DPO', icon: Shield },
];

export default function PrivacyPolicyPage() {
    const { auth } = usePage<SharedData>().props;
    const [activeSection, setActiveSection] = useState('mandate');

    const scrollTo = (id: string) => {
        setActiveSection(id);
        const el = document.getElementById(id);
        if (el) {
            el.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    };

    return (
        <>
            <Head title="Data Privacy Policy – OSAMS" />
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
                                <ShieldCheck className="h-3.5 w-3.5 text-blue-300 animate-pulse" />
                                Republic Act No. 10173 Compliant
                            </div>
                        </div>

                        <h1 className="text-xl sm:text-2xl md:text-3xl font-bold tracking-tight text-white mb-2">
                            Data Privacy Policy & Protection Notice
                        </h1>

                        <p className="mx-auto max-w-2xl text-xs sm:text-sm text-blue-100/90 leading-relaxed font-normal">
                            How the Office of Student Affairs and Services (OSAMS) at St. Rita's College of Balingasag protects, processes, and respects student personal and sensitive information.
                        </p>

                        <div className="mt-3 flex flex-wrap items-center justify-center gap-4 text-[11px] text-blue-200 font-medium">
                            <span className="flex items-center gap-1">
                                <Calendar className="h-3.5 w-3.5 text-blue-300" />
                                Effective Date: Academic Year 2024–2026
                            </span>
                            <span className="hidden sm:inline">•</span>
                            <span className="flex items-center gap-1">
                                <FileCheck className="h-3.5 w-3.5 text-blue-300" />
                                Version: 2.4 (Official Institutional Release)
                            </span>
                        </div>
                    </div>
                </section>

                {/* ── Main Policy Content ─────────────────────────────────── */}
                <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-12 lg:px-8">
                    <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
                        {/* Sidebar Navigation */}
                        <div className="lg:col-span-4 xl:col-span-3">
                            <div className="sticky top-20 rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm space-y-1">
                                <h3 className="px-3 py-2 text-xs font-black uppercase tracking-wider text-slate-400">
                                    Policy Sections
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
                                    <div className="rounded-xl bg-blue-50/80 p-3 text-xs text-slate-600 space-y-1.5">
                                        <div className="flex items-center gap-1 text-[#000D6A] font-bold">
                                            <Info className="h-3.5 w-3.5 text-blue-600" />
                                            <span>Quick Summary</span>
                                        </div>
                                        <p className="text-[11px] leading-relaxed text-slate-500">
                                            We do not sell student data. Information is strictly used for school attendance, clearance, discipline management, and official certifications.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Content Body */}
                        <div className="lg:col-span-8 xl:col-span-9 space-y-8">
                            {/* SECTION 1 */}
                            <section
                                id="mandate"
                                className="scroll-mt-24 rounded-2xl border border-slate-200/80 bg-white p-6 sm:p-8 shadow-xs space-y-4"
                            >
                                <div className="flex items-center gap-3">
                                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-[#000D6A]">
                                        <Scale className="h-5 w-5" />
                                    </div>
                                    <div>
                                        <span className="text-[10px] font-bold text-blue-600 uppercase tracking-wider">Section 1</span>
                                        <h2 className="text-lg sm:text-xl font-bold text-slate-900">
                                            Legal Mandate & Institutional Scope
                                        </h2>
                                    </div>
                                </div>

                                <div className="space-y-3 text-xs sm:text-sm text-slate-600 leading-relaxed">
                                    <p>
                                        St. Rita’s College of Balingasag (SRCB), operating through its <strong>Office of Student Affairs and Services (OSAMS)</strong>, adheres strictly to the provisions of <strong>Republic Act No. 10173</strong>, otherwise known as the <em>Data Privacy Act of 2012 (DPA)</em>, its Implementing Rules and Regulations (IRR), and relevant National Privacy Commission (NPC) issuances.
                                    </p>
                                    <p>
                                        This policy governs all personal information, sensitive personal information, and privileged information collected, recorded, organized, stored, updated, retrieved, consulted, and processed through the OSAMS web portal, Progressive Web App (PWA), and associated mobile and server subsystems.
                                    </p>
                                </div>
                            </section>

                            {/* SECTION 2 */}
                            <section
                                id="collection"
                                className="scroll-mt-24 rounded-2xl border border-slate-200/80 bg-white p-6 sm:p-8 shadow-xs space-y-4"
                            >
                                <div className="flex items-center gap-3">
                                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-indigo-700">
                                        <Database className="h-5 w-5" />
                                    </div>
                                    <div>
                                        <span className="text-[10px] font-bold text-indigo-600 uppercase tracking-wider">Section 2</span>
                                        <h2 className="text-lg sm:text-xl font-bold text-slate-900">
                                            Information We Collect
                                        </h2>
                                    </div>
                                </div>

                                <div className="space-y-3 text-xs sm:text-sm text-slate-600 leading-relaxed">
                                    <p>To deliver automated academic affairs services, OSAMS collects the following data points:</p>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2">
                                        <div className="rounded-xl border border-slate-200/70 bg-slate-50/50 p-4 space-y-1">
                                            <h4 className="font-bold text-slate-900 text-xs">A. Profile & Academic Identifiers</h4>
                                            <p className="text-xs text-slate-500 leading-relaxed">
                                                Full name, official Student ID number, academic program/course, year level, institutional email address, contact phone number, and guardian contact details.
                                            </p>
                                        </div>
                                        <div className="rounded-xl border border-slate-200/70 bg-slate-50/50 p-4 space-y-1">
                                            <h4 className="font-bold text-slate-900 text-xs">B. Event Attendance Logs</h4>
                                            <p className="text-xs text-slate-500 leading-relaxed">
                                                Dynamic 30-second token scan timestamps, check-in and check-out records, attendance status (On-Time / Late), and event session identifiers.
                                            </p>
                                        </div>
                                        <div className="rounded-xl border border-slate-200/70 bg-slate-50/50 p-4 space-y-1">
                                            <h4 className="font-bold text-slate-900 text-xs">C. Admission & Medical Records</h4>
                                            <p className="text-xs text-slate-500 leading-relaxed">
                                                Justification letters for absences/tardiness, attached medical proof/certificates from certified clinics, and DSA officer approval metadata.
                                            </p>
                                        </div>
                                        <div className="rounded-xl border border-slate-200/70 bg-slate-50/50 p-4 space-y-1">
                                            <h4 className="font-bold text-slate-900 text-xs">D. Disciplinary & Incident Records</h4>
                                            <p className="text-xs text-slate-500 leading-relaxed">
                                                Summons calling notices, handbook violation case files, hearing conference schedules, and completed community service restitution hours.
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </section>

                            {/* SECTION 3 */}
                            <section
                                id="processing"
                                className="scroll-mt-24 rounded-2xl border border-slate-200/80 bg-white p-6 sm:p-8 shadow-xs space-y-4"
                            >
                                <div className="flex items-center gap-3">
                                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                                        <UserCheck className="h-5 w-5" />
                                    </div>
                                    <div>
                                        <span className="text-[10px] font-bold text-blue-600 uppercase tracking-wider">Section 3</span>
                                        <h2 className="text-lg sm:text-xl font-bold text-slate-900">
                                            Purpose and Legitimate Use of Processing
                                        </h2>
                                    </div>
                                </div>

                                <div className="space-y-3 text-xs sm:text-sm text-slate-600 leading-relaxed">
                                    <p>Personal data collected is processed strictly for the following legitimate institutional purposes:</p>
                                    <ul className="space-y-2 list-disc list-inside text-slate-600 pl-1">
                                        <li><strong>Attendance Verification:</strong> Confirming active attendance at mandatory institutional events, general assemblies, and seminars.</li>
                                        <li><strong>Re-Admission Clearance:</strong> Evaluating electronic excuse slips to issue official Admission Slips for class re-entry.</li>
                                        <li><strong>Certificate Issuance:</strong> Automatically generating and issuing authenticated digital Certificates of Participation upon survey completion.</li>
                                        <li><strong>Discipline Management:</strong> Facilitating due-process student conferences, summons tracking, and student handbook compliance.</li>
                                        <li><strong>Lost and Found Security:</strong> Managing lost property claims and verifying student ownership before release.</li>
                                    </ul>
                                </div>
                            </section>

                            {/* SECTION 4 */}
                            <section
                                id="geotagging"
                                className="scroll-mt-24 rounded-2xl border border-slate-200/80 bg-white p-6 sm:p-8 shadow-xs space-y-4"
                            >
                                <div className="flex items-center gap-3">
                                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
                                        <QrCode className="h-5 w-5" />
                                    </div>
                                    <div>
                                        <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-wider">Section 4</span>
                                        <h2 className="text-lg sm:text-xl font-bold text-slate-900">
                                            GPS Geofencing & Dynamic QR Anti-Fraud Safeguards
                                        </h2>
                                    </div>
                                </div>

                                <div className="space-y-3 text-xs sm:text-sm text-slate-600 leading-relaxed">
                                    <p>
                                        OSAMS utilizes real-time GPS Geofencing (Harversine distance formula) and 30-second HMAC-SHA256 rotating QR tokens to verify physical attendance and eliminate proxy check-ins:
                                    </p>
                                    <div className="rounded-xl bg-emerald-50/70 border border-emerald-200/70 p-4 text-xs text-emerald-900 space-y-2">
                                        <div className="flex items-center gap-1.5 font-bold">
                                            <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                                            <span>No Continuous Location Tracking</span>
                                        </div>
                                        <p className="text-emerald-800 leading-relaxed">
                                            Geotag coordinates (Latitude, Longitude, Accuracy) are retrieved <strong>only at the precise millisecond</strong> a student initiates a check-in request. OSAMS <strong>never</strong> tracks location in the background or monitors movement outside of designated check-in triggers.
                                        </p>
                                    </div>
                                </div>
                            </section>

                            {/* SECTION 5 */}
                            <section
                                id="access-control"
                                className="scroll-mt-24 rounded-2xl border border-slate-200/80 bg-white p-6 sm:p-8 shadow-xs space-y-4"
                            >
                                <div className="flex items-center gap-3">
                                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-50 text-amber-600">
                                        <Lock className="h-5 w-5" />
                                    </div>
                                    <div>
                                        <span className="text-[10px] font-bold text-amber-600 uppercase tracking-wider">Section 5</span>
                                        <h2 className="text-lg sm:text-xl font-bold text-slate-900">
                                            Access Control & Third-Party Non-Disclosure
                                        </h2>
                                    </div>
                                </div>

                                <div className="space-y-3 text-xs sm:text-sm text-slate-600 leading-relaxed">
                                    <p>
                                        Access to student records is governed by strict Role-Based Access Control (RBAC):
                                    </p>
                                    <ul className="space-y-2 list-disc list-inside text-slate-600 pl-1">
                                        <li><strong>Dean of Student Affairs / DSA Admins:</strong> Full authority to approve clearances, review disciplinary logs, and manage institution-wide event settings.</li>
                                        <li><strong>Department Program Heads:</strong> Limited scope to students enrolled strictly within their assigned academic programs.</li>
                                        <li><strong>Third-Party Policy:</strong> Under no circumstances does SRCB or OSAMS sell, lease, or monetize student records to commercial entities, advertising agencies, or unauthorized external parties.</li>
                                    </ul>
                                </div>
                            </section>

                            {/* SECTION 6 */}
                            <section
                                id="retention"
                                className="scroll-mt-24 rounded-2xl border border-slate-200/80 bg-white p-6 sm:p-8 shadow-xs space-y-4"
                            >
                                <div className="flex items-center gap-3">
                                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-violet-50 text-violet-600">
                                        <ShieldCheck className="h-5 w-5" />
                                    </div>
                                    <div>
                                        <span className="text-[10px] font-bold text-violet-600 uppercase tracking-wider">Section 6</span>
                                        <h2 className="text-lg sm:text-xl font-bold text-slate-900">
                                            Data Storage, Encryption & Archival Retention
                                        </h2>
                                    </div>
                                </div>

                                <div className="space-y-3 text-xs sm:text-sm text-slate-600 leading-relaxed">
                                    <p>
                                        Student records are stored within protected, encrypted MySQL database clusters protected by modern HTTPS / TLS 1.3 encryption in transit and AES-256 encryption at rest.
                                    </p>
                                    <p>
                                        In compliance with Commission on Higher Education (CHED) institutional archival requirements, electronic clearance, attendance, and disciplinary summary files are maintained during the student’s residency and archived securely for a minimum of five (5) academic years post-graduation before scheduled cryptographic erasure.
                                    </p>
                                </div>
                            </section>

                            {/* SECTION 7 */}
                            <section
                                id="rights"
                                className="scroll-mt-24 rounded-2xl border border-slate-200/80 bg-white p-6 sm:p-8 shadow-xs space-y-5"
                            >
                                <div className="flex items-center gap-3">
                                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-[#000D6A]">
                                        <Shield className="h-5 w-5" />
                                    </div>
                                    <div>
                                        <span className="text-[10px] font-bold text-blue-600 uppercase tracking-wider">Section 7</span>
                                        <h2 className="text-lg sm:text-xl font-bold text-slate-900">
                                            Student Data Rights & Data Protection Officer Contact
                                        </h2>
                                    </div>
                                </div>

                                <div className="space-y-3 text-xs sm:text-sm text-slate-600 leading-relaxed">
                                    <p>
                                        Under Republic Act No. 10173, students retain the following fundamental rights:
                                    </p>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                                        <div className="rounded-xl border border-slate-200/70 p-3 text-xs">
                                            <strong className="text-slate-900 block mb-0.5">1. Right to Be Informed</strong>
                                            <span className="text-slate-500">Know how and why your personal records are gathered and used.</span>
                                        </div>
                                        <div className="rounded-xl border border-slate-200/70 p-3 text-xs">
                                            <strong className="text-slate-900 block mb-0.5">2. Right to Access & Rectify</strong>
                                            <span className="text-slate-500">Inspect personal attendance logs and request prompt correction of inaccuracies.</span>
                                        </div>
                                        <div className="rounded-xl border border-slate-200/70 p-3 text-xs">
                                            <strong className="text-slate-900 block mb-0.5">3. Right to Object & File Complaint</strong>
                                            <span className="text-slate-500">Lodge formal inquiries regarding unauthorized data processing with the DPO.</span>
                                        </div>
                                        <div className="rounded-xl border border-slate-200/70 p-3 text-xs">
                                            <strong className="text-slate-900 block mb-0.5">4. Right to Data Portability</strong>
                                            <span className="text-slate-500">Request electronic copies of your approved certificates and verified clearances.</span>
                                        </div>
                                    </div>
                                </div>

                                {/* DPO Contact Box */}
                                <div className="rounded-2xl bg-gradient-to-r from-[#000D6A] via-[#0B2D66] to-[#12397B] p-5 sm:p-6 text-white space-y-4">
                                    <div>
                                        <div className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-2.5 py-0.5 text-[10px] font-semibold text-blue-200 uppercase tracking-wider">
                                            <Building2 className="h-3 w-3" />
                                            Data Protection Office
                                        </div>
                                        <h3 className="text-base sm:text-lg font-bold text-white mt-1">
                                            Contact the Institutional Data Protection Officer
                                        </h3>
                                    </div>

                                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                                        <div className="rounded-xl bg-white/10 p-3 border border-white/10 space-y-0.5">
                                            <span className="text-blue-300 font-bold block">DPO Email</span>
                                            <span className="text-white">dpo@srcb.edu.ph</span>
                                        </div>
                                        <div className="rounded-xl bg-white/10 p-3 border border-white/10 space-y-0.5">
                                            <span className="text-blue-300 font-bold block">Campus Office</span>
                                            <span className="text-white">Student Affairs Building, Ground Floor</span>
                                        </div>
                                        <div className="rounded-xl bg-white/10 p-3 border border-white/10 space-y-0.5">
                                            <span className="text-blue-300 font-bold block">Office Telephone</span>
                                            <span className="text-white">(088) 123-4567 • Ext. 104</span>
                                        </div>
                                    </div>
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
