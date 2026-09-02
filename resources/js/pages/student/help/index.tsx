import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { studentDashboard, studentHelp } from '@/routes';
import type { BreadcrumbItem } from '@/types';
import { Head } from '@inertiajs/react';
import {
    Activity,
    BookOpen,
    Calendar,
    CheckCircle2,
    FileQuestion,
    FileText,
    HelpCircle,
    LifeBuoy,
    Mail,
    QrCode,
    Shield,
    Users,
} from 'lucide-react';
import { useState } from 'react';
import StudentLayout from '../components/StudentLayout';

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Dashboard', href: studentDashboard() },
    { title: 'Help Center', href: studentHelp() },
];

export default function StudentHelpPage() {
    const [activeSection, setActiveSection] = useState<'all' | 'attendance' | 'evaluations' | 'clearance' | 'faqs'>('all');

    const sections = [
        { id: 'attendance', title: 'QR Attendance', icon: QrCode, color: 'text-blue-500 bg-blue-50 dark:bg-blue-950/40 dark:text-blue-400' },
        { id: 'evaluations', title: 'Event Evaluations', icon: FileText, color: 'text-purple-500 bg-purple-50 dark:bg-purple-950/40 dark:text-purple-400' },
        { id: 'clearance', title: 'Clearance & Slips', icon: Shield, color: 'text-rose-500 bg-rose-50 dark:bg-rose-950/40 dark:text-rose-400' },
        { id: 'faqs', title: 'FAQs & Support', icon: FileQuestion, color: 'text-amber-500 bg-amber-50 dark:bg-amber-950/40 dark:text-amber-400' },
    ];

    const faqs = [
        {
            q: "Where is my personal QR code?",
            a: "Your personal attendance QR code is displayed right on the center of your student dashboard dashboard. Present this code to CSG scanners during event checks."
        },
        {
            q: "Why am I getting a location geofence error during scan?",
            a: "Some events require you to be physically present at the venue to check in. Make sure your smartphone location (GPS) services are turned on and set to High Accuracy."
        },
        {
            q: "How do I get cleared from an attendance infraction?",
            a: "If you missed an event, check the 'Violations' panel on your dashboard. Resolve the sanction with your Department Head, and once approved, they will issue an admission slip."
        },
        {
            q: "Where do I fill out evaluation forms?",
            a: "Once your attendance check-out is registered, look under 'Pending Evaluations' on your dashboard page to rate the event and write feedback comments."
        }
    ];

    return (
        <StudentLayout breadcrumbs={breadcrumbs}>
            <Head title="Student Help Center" />

            <div className="pb-12 text-slate-900 dark:text-white">
                <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-4 py-4 sm:px-6 lg:px-8">
                    {/* Header Banner */}
                    <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#0b2d66] via-[#103875] to-[#1e40af] p-6 text-white shadow-xl">
                        <div className="absolute -right-8 -top-8 h-32 w-32 rounded-full bg-white/5 pointer-events-none" />
                        <div className="absolute right-12 bottom-0 h-48 w-48 rounded-full bg-blue-400/10 blur-2xl pointer-events-none" />
                        <div className="relative flex flex-col gap-4 sm:flex-row sm:items-center">
                            <div className="flex items-center gap-4">
                                <div className="grid h-12 w-12 place-items-center rounded-xl bg-white/10 text-white backdrop-blur-md">
                                    <LifeBuoy className="h-6 w-6" />
                                </div>
                                <div>
                                    <h1 className="text-xl font-bold sm:text-2xl">Student Help Center</h1>
                                    <p className="mt-0.5 text-xs text-blue-200/80 sm:text-sm">
                                        Learn how to use your student portal, complete QR check-ins, and clear academic infractions.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Navigation Tabs */}
                    <div className="flex flex-wrap gap-2 border-b border-slate-200 pb-2 dark:border-slate-800">
                        <button
                            type="button"
                            onClick={() => setActiveSection('all')}
                            className={`rounded-xl px-4 py-2 text-xs font-semibold uppercase tracking-wider transition-all ${activeSection === 'all' ? 'bg-blue-600 text-white shadow-sm shadow-blue-500/10' : 'text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800'}`}
                        >
                            All Guidelines
                        </button>
                        {sections.map((s) => (
                            <button
                                key={s.id}
                                type="button"
                                onClick={() => setActiveSection(s.id as any)}
                                className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-semibold uppercase tracking-wider transition-all ${activeSection === s.id ? 'bg-blue-600 text-white shadow-sm shadow-blue-500/10' : 'text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800'}`}
                            >
                                <s.icon className="h-3.5 w-3.5" />
                                {s.title}
                            </button>
                        ))}
                    </div>

                    {/* Guidelines Content */}
                    <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
                        {/* Left column: Documentation Cards */}
                        <div className="space-y-6 lg:col-span-2">
                            {/* Attendance Guide */}
                            {(activeSection === 'all' || activeSection === 'attendance') && (
                                <Card className="rounded-2xl border-slate-200/60 dark:border-slate-800 bg-white dark:bg-[#0B192C]">
                                    <CardHeader className="flex flex-row items-center gap-3 space-y-0 border-b border-slate-100 pb-4 dark:border-slate-800">
                                        <div className="rounded-lg bg-blue-50 p-2.5 text-blue-600 dark:bg-blue-950/40 dark:text-blue-400">
                                            <QrCode className="h-5 w-5" />
                                        </div>
                                        <div>
                                            <CardTitle className="text-base font-bold">1. Event Check-ins & QR Scanning</CardTitle>
                                            <CardDescription className="text-xs">Quick guides to attendance and scanning procedures</CardDescription>
                                        </div>
                                    </CardHeader>
                                    <CardContent className="pt-6 space-y-4 text-xs leading-relaxed text-slate-600 dark:text-slate-300">
                                        <p>
                                            Student check-ins are logged using barcode QR indicators displayed on your dashboard.
                                        </p>
                                        <div className="space-y-2">
                                            <div className="flex gap-2">
                                                <strong className="text-slate-900 dark:text-white min-w-[120px]">Personal QR Code:</strong>
                                                <span>Present your student QR code on your mobile phone to assigned CSG scanning officers at event entries and exits.</span>
                                            </div>
                                            <div className="flex gap-2">
                                                <strong className="text-slate-900 dark:text-white min-w-[120px]">GPS Geofencing:</strong>
                                                <span>If checking in using the self-scan portal, confirm that your smartphone location permissions are turned on and that you are inside the event venue perimeter.</span>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            )}

                            {/* Evaluations Guide */}
                            {(activeSection === 'all' || activeSection === 'evaluations') && (
                                <Card className="rounded-2xl border-slate-200/60 dark:border-slate-800 bg-white dark:bg-[#0B192C]">
                                    <CardHeader className="flex flex-row items-center gap-3 space-y-0 border-b border-slate-100 pb-4 dark:border-slate-800">
                                        <div className="rounded-lg bg-purple-50 p-2.5 text-purple-600 dark:bg-purple-950/40 dark:text-purple-400">
                                            <FileText className="h-5 w-5" />
                                        </div>
                                        <div>
                                            <CardTitle className="text-base font-bold">2. Event Evaluations</CardTitle>
                                            <CardDescription className="text-xs">Submit feedback surveys to complete attendance requirements</CardDescription>
                                        </div>
                                    </CardHeader>
                                    <CardContent className="pt-6 space-y-4 text-xs leading-relaxed text-slate-600 dark:text-slate-300">
                                        <p>
                                            To complete seminar clearance requirements, students must submit feedback evaluations for each attended event.
                                        </p>
                                        <div className="space-y-2">
                                            <div className="flex gap-2">
                                                <strong className="text-slate-900 dark:text-white min-w-[120px]">Pending Reviews:</strong>
                                                <span>After checking out of an event, an evaluation prompt will show under the 'Pending Evaluations' list on your homepage.</span>
                                            </div>
                                            <div className="flex gap-2">
                                                <strong className="text-slate-900 dark:text-white min-w-[120px]">Rating Scales:</strong>
                                                <span>Assess event categories (e.g. speakers, program coordination) from 1 (poor) to 5 (excellent) and write constructive comments.</span>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            )}

                            {/* Clearance Guide */}
                            {(activeSection === 'all' || activeSection === 'clearance') && (
                                <Card className="rounded-2xl border-slate-200/60 dark:border-slate-800 bg-white dark:bg-[#0B192C]">
                                    <CardHeader className="flex flex-row items-center gap-3 space-y-0 border-b border-slate-100 pb-4 dark:border-slate-800">
                                        <div className="rounded-lg bg-rose-50 p-2.5 text-rose-600 dark:bg-rose-950/40 dark:text-rose-400">
                                            <Shield className="h-5 w-5" />
                                        </div>
                                        <div>
                                            <CardTitle className="text-base font-bold">3. Clearance & Disciplinary Slips</CardTitle>
                                            <CardDescription className="text-xs">Understand violations, clearances and class returns</CardDescription>
                                        </div>
                                    </CardHeader>
                                    <CardContent className="pt-6 space-y-4 text-xs leading-relaxed text-slate-600 dark:text-slate-300">
                                        <p>
                                            Maintain proper disciplinary standing. Absences or infractions create disciplinary logs.
                                        </p>
                                        <div className="space-y-2">
                                            <div className="flex gap-2">
                                                <strong className="text-slate-900 dark:text-white min-w-[120px]">Incident Logs:</strong>
                                                <span>Check the Violations section on your dashboard to see any logged incidents or required clearances.</span>
                                            </div>
                                            <div className="flex gap-2">
                                                <strong className="text-slate-900 dark:text-white min-w-[120px]">Admission Slips:</strong>
                                                <span>To return to class after an infraction, resolve the sanction with your Department Head. Once verified, request an official Admission Slip to be printed.</span>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            )}

                            {/* FAQ Section */}
                            {(activeSection === 'all' || activeSection === 'faqs') && (
                                <div className="space-y-4">
                                    <h3 className="text-sm font-bold text-slate-800 dark:text-white flex items-center gap-2">
                                        <FileQuestion className="h-4 w-4 text-amber-500" />
                                        Frequently Asked Questions
                                    </h3>
                                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                        {faqs.map((f, i) => (
                                            <Card key={i} className="rounded-2xl border-slate-200/60 dark:border-slate-800 bg-white dark:bg-[#0B192C]/50 backdrop-blur-xs">
                                                <CardHeader className="pb-2">
                                                    <CardTitle className="text-xs font-bold text-slate-800 dark:text-white">Q: {f.q}</CardTitle>
                                                </CardHeader>
                                                <CardContent>
                                                    <p className="text-[11px] leading-relaxed text-slate-500 dark:text-slate-400">A: {f.a}</p>
                                                </CardContent>
                                            </Card>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Right column: Quick contacts / System Status */}
                        <div className="space-y-6">
                            {/* System Status Support Card */}
                            <Card className="rounded-2xl border-slate-200/60 bg-gradient-to-br from-blue-50/50 to-indigo-50/50 dark:border-slate-800 dark:bg-slate-900 dark:to-slate-800">
                                <CardHeader>
                                    <CardTitle className="text-sm font-bold text-slate-900 dark:text-white">System Support</CardTitle>
                                    <CardDescription className="text-xs">Report scanner issues or account bugs</CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="flex items-center gap-3">
                                        <div className="grid h-8 w-8 place-items-center rounded-lg bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400">
                                            <Mail className="h-4 w-4" />
                                        </div>
                                        <div>
                                            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Office of Student Affairs</div>
                                            <div className="text-xs font-semibold text-slate-800 dark:text-slate-200">dsa@srcb.edu.ph</div>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <div className="grid h-8 w-8 place-items-center rounded-lg bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400">
                                            <HelpCircle className="h-4 w-4" />
                                        </div>
                                        <div>
                                            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Help Desk Hours</div>
                                            <div className="text-xs font-semibold text-slate-800 dark:text-slate-200">Mon - Fri: 8:00 AM - 5:00 PM</div>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                    </div>
                </div>
            </div>
        </StudentLayout>
    );
}
