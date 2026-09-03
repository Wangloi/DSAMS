import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { adminDashboard, adminHelp } from '@/routes';
import type { BreadcrumbItem } from '@/types';
import { Head } from '@inertiajs/react';
import {
    Activity,
    BookOpen,
    Calendar,
    CheckCircle2,
    ClipboardList,
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
import AdminLayout from '../admin-layout';

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Admin Dashboard', href: adminDashboard() },
    { title: 'Help & Guidelines', href: adminHelp() },
];

export default function AdminHelpPage() {
    const [activeSection, setActiveSection] = useState<'all' | 'dashboard' | 'attendance' | 'users' | 'events' | 'violations' | 'faqs'>('all');

    const sections = [
        { id: 'dashboard', title: 'Main Dashboard', icon: Activity, color: 'text-blue-500 bg-blue-50 dark:bg-blue-950/40 dark:text-blue-400' },
        { id: 'attendance', title: 'Attendance & QR Scanner', icon: QrCode, color: 'text-emerald-500 bg-emerald-50 dark:bg-emerald-950/40 dark:text-emerald-400' },
        { id: 'users', title: 'User Management', icon: Users, color: 'text-indigo-500 bg-indigo-50 dark:bg-indigo-950/40 dark:text-indigo-400' },
        { id: 'events', title: 'Events & Evaluations', icon: Calendar, color: 'text-purple-500 bg-purple-50 dark:bg-purple-950/40 dark:text-purple-400' },
        { id: 'violations', title: 'Violations & Slips', icon: Shield, color: 'text-rose-500 bg-rose-50 dark:bg-rose-950/40 dark:text-rose-400' },
        { id: 'faqs', title: 'FAQs & Troubleshooting', icon: FileQuestion, color: 'text-amber-500 bg-amber-50 dark:bg-amber-950/40 dark:text-amber-400' },
    ];

    const faqs = [
        {
            q: "What should I do if a student's QR code fails to scan?",
            a: "Ensure the camera has proper lighting and that the student's screen brightness is turned up. If it still fails, check-in the student manually via the Attendance list on the specific event page."
        },
        {
            q: "How does geofencing restriction work for event check-in?",
            a: "Geofencing uses coordinates (Latitude & Longitude) and a radius in meters. When activated, students can only check in if their GPS device report falls within the specified radius. If a student gets a 'location error', ask them to enable GPS high-accuracy location services."
        },
        {
            q: "How do I print admission slips on a thermal printer?",
            a: "Simply click 'Print' on any admission slip. The print dialog is automatically configured for standard 80mm thermal receipt roll paper. Ensure your printer paper margins are disabled in your browser's print options for the best formatting."
        },
        {
            q: "How can I bulk import multiple students into the system?",
            a: "Navigate to Manage Users, click 'Bulk Add Students', download the CSV template, fill in the student records (Student ID, Name, Program, Year), and upload the spreadsheet."
        },
        {
            q: "What do the 'Awaiting Action', 'Pending Decision', and 'Overdue' cards indicate in Incidents & Violations?",
            a: "'Awaiting Action' tracks active cases in Investigation/Hearing (Phases 2–3) needing officer response. 'Pending Decision' tracks cases in Sanction/Appeal deliberation (Phases 4–5). 'Overdue (> 7 days)' flags cases stalled in their current step for more than a week to protect student due process."
        },
        {
            q: "How does the 5-Step SRCB Protocol work for student calling and case resolution?",
            a: "It follows the official SRCB 5-step SOP: 1) Report Incident (log violation), 2) Investigation (gather facts within 24-48h), 3) Meeting/Hearing (issue calling slips and summon student/parents), 4) Outcome/Sanction (determine handbook penalty), and 5) Appeal/Closure (reconsideration & final case archiving)."
        }
    ];

    return (
        <AdminLayout breadcrumbs={breadcrumbs}>
            <Head title="System Help & Guide" />

            <div className="min-h-[calc(100vh-4rem)] bg-slate-50 dark:bg-slate-900 pb-12">
                <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-6 py-6">
                    {/* Header Banner */}
                    <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#0b1c5c] via-[#1e3a8a] to-[#23509A] p-6 text-white shadow-xl">
                        <div className="absolute -right-8 -top-8 h-32 w-32 rounded-full bg-white/5 pointer-events-none" />
                        <div className="absolute right-12 bottom-0 h-48 w-48 rounded-full bg-blue-400/10 blur-2xl pointer-events-none" />
                        <div className="relative flex flex-col gap-4 sm:flex-row sm:items-center">
                            <div className="flex items-center gap-4">
                                <div className="grid h-12 w-12 place-items-center rounded-xl bg-white/10 text-white backdrop-blur-md">
                                    <LifeBuoy className="h-6 w-6" />
                                </div>
                                <div>
                                    <h1 className="text-xl font-bold sm:text-2xl">Help & Documentation Center</h1>
                                    <p className="mt-0.5 text-xs text-blue-200/80 sm:text-sm">
                                        Comprehensive administrative guidelines, step-by-step module walk-throughs, and troubleshooting guides.
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
                            {/* Dashboard Guide */}
                            {(activeSection === 'all' || activeSection === 'dashboard') && (
                                <Card className="rounded-2xl border-slate-200/60 dark:border-slate-800">
                                    <CardHeader className="flex flex-row items-center gap-3 space-y-0 border-b border-slate-100 pb-4 dark:border-slate-800">
                                        <div className="rounded-lg bg-blue-50 p-2.5 text-blue-600 dark:bg-blue-950/40 dark:text-blue-400">
                                            <Activity className="h-5 w-5" />
                                        </div>
                                        <div>
                                            <CardTitle className="text-base font-bold">1. Main Dashboard Overview</CardTitle>
                                            <CardDescription className="text-xs">Quick insights and operational tools</CardDescription>
                                        </div>
                                    </CardHeader>
                                    <CardContent className="pt-6 space-y-4 text-xs leading-relaxed text-slate-600 dark:text-slate-300">
                                        <p>
                                            The main dashboard serves as the administrative command center, providing critical telemetry data across all campus systems.
                                        </p>
                                        <div className="space-y-2">
                                            <div className="flex gap-2">
                                                <strong className="text-slate-900 dark:text-white min-w-[120px]">Telemetry widgets:</strong>
                                                <span>Displays real-time metrics, such as today's event attendance, total active student records, pending student sign-ups, and active event calendars.</span>
                                            </div>
                                            <div className="flex gap-2">
                                                <strong className="text-slate-900 dark:text-white min-w-[120px]">Quick Actions:</strong>
                                                <span>Provides instant shortcut controls to launch the QR scanner, trigger bulk user import dialogs, register a student, or issue an admission slip without navigating away.</span>
                                            </div>
                                            <div className="flex gap-2">
                                                <strong className="text-slate-900 dark:text-white min-w-[120px]">Recent Activity:</strong>
                                                <span>A live activity feed showing the latest operations executed in the system, ensuring security compliance and audit trails.</span>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            )}

                            {/* Attendance Guide */}
                            {(activeSection === 'all' || activeSection === 'attendance') && (
                                <Card className="rounded-2xl border-slate-200/60 dark:border-slate-800">
                                    <CardHeader className="flex flex-row items-center gap-3 space-y-0 border-b border-slate-100 pb-4 dark:border-slate-800">
                                        <div className="rounded-lg bg-emerald-50 p-2.5 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400">
                                            <QrCode className="h-5 w-5" />
                                        </div>
                                        <div>
                                            <CardTitle className="text-base font-bold">2. Attendance Tracking & QR Scanner</CardTitle>
                                            <CardDescription className="text-xs">Manage check-ins, portals, and location boundaries</CardDescription>
                                        </div>
                                    </CardHeader>
                                    <CardContent className="pt-6 space-y-4 text-xs leading-relaxed text-slate-600 dark:text-slate-300">
                                        <p>
                                            The system utilizes advanced QR scanner controls to log attendance for school-sanctioned events.
                                        </p>
                                        <div className="space-y-2">
                                            <div className="flex gap-2">
                                                <strong className="text-slate-900 dark:text-white min-w-[120px]">Event Selection:</strong>
                                                <span>To start scanning, choose an event from the list. The scanner will automatically assign check-ins to that event.</span>
                                            </div>
                                            <div className="flex gap-2">
                                                <strong className="text-slate-900 dark:text-white min-w-[120px]">Scanner Modes:</strong>
                                                <span>Use <strong>Live Camera Scanner</strong> (scans via your webcam) or <strong>Activate Scanner Portal</strong> (deploys a kiosk portal allowing students/representatives to scan with their own devices).</span>
                                            </div>
                                            <div className="flex gap-2">
                                                <strong className="text-slate-900 dark:text-white min-w-[120px]">Geofencing Bounds:</strong>
                                                <span>Restrict sign-ins to specific venues. Enter Latitude and Longitude values, set a radius threshold, and check-ins outside the perimeter will be blocked.</span>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            )}

                            {/* User Management Guide */}
                            {(activeSection === 'all' || activeSection === 'users') && (
                                <Card className="rounded-2xl border-slate-200/60 dark:border-slate-800">
                                    <CardHeader className="flex flex-row items-center gap-3 space-y-0 border-b border-slate-100 pb-4 dark:border-slate-800">
                                        <div className="rounded-lg bg-indigo-50 p-2.5 text-indigo-600 dark:bg-indigo-950/40 dark:text-indigo-400">
                                            <Users className="h-5 w-5" />
                                        </div>
                                        <div>
                                            <CardTitle className="text-base font-bold">3. User Account Management</CardTitle>
                                            <CardDescription className="text-xs">Approvals, roles, and batch uploads</CardDescription>
                                        </div>
                                    </CardHeader>
                                    <CardContent className="pt-6 space-y-4 text-xs leading-relaxed text-slate-600 dark:text-slate-300">
                                        <p>
                                            Manage academic accounts, student registrations, CSG officer roles, and program head designations.
                                        </p>
                                        <div className="space-y-2">
                                            <div className="flex gap-2">
                                                <strong className="text-slate-900 dark:text-white min-w-[120px]">Student Approvals:</strong>
                                                <span>Students registering manually are placed under <strong>Pending Approvals</strong>. Admins must verify student credentials before activating accounts.</span>
                                            </div>
                                            <div className="flex gap-2">
                                                <strong className="text-slate-900 dark:text-white min-w-[120px]">Department Heads:</strong>
                                                <span>Add Program Heads and link them to their respective departments (e.g. BSIT, BSEE) to allow them to manage local department evaluations and violations.</span>
                                            </div>
                                            <div className="flex gap-2">
                                                <strong className="text-slate-900 dark:text-white min-w-[120px]">Bulk Import:</strong>
                                                <span>Register entire semesters at once. Simply upload a CSV file matching the required template format to register student batches instantly.</span>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            )}

                            {/* Events Guide */}
                            {(activeSection === 'all' || activeSection === 'events') && (
                                <Card className="rounded-2xl border-slate-200/60 dark:border-slate-800">
                                    <CardHeader className="flex flex-row items-center gap-3 space-y-0 border-b border-slate-100 pb-4 dark:border-slate-800">
                                        <div className="rounded-lg bg-purple-50 p-2.5 text-purple-600 dark:bg-purple-950/40 dark:text-purple-400">
                                            <Calendar className="h-5 w-5" />
                                        </div>
                                        <div>
                                            <CardTitle className="text-base font-bold">4. Events & Evaluations</CardTitle>
                                            <CardDescription className="text-xs">Schedule activities and analyze feedback forms</CardDescription>
                                        </div>
                                    </CardHeader>
                                    <CardContent className="pt-6 space-y-4 text-xs leading-relaxed text-slate-600 dark:text-slate-300">
                                        <p>
                                            Schedule campus events and link evaluation questionnaires to assess ratings and student satisfaction.
                                        </p>
                                        <div className="space-y-2">
                                            <div className="flex gap-2">
                                                <strong className="text-slate-900 dark:text-white min-w-[120px]">Scheduling Events:</strong>
                                                <span>Provide event details, scheduled times, and targets. You can target specific departments or restrict access to particular year levels.</span>
                                            </div>
                                            <div className="flex gap-2">
                                                <strong className="text-slate-900 dark:text-white min-w-[120px]">Evaluation Forms:</strong>
                                                <span>Set up questionnaires with rating scales (1 to 5) and feedback text fields. Forms will be accessible on the student portal upon successful attendance check-in.</span>
                                            </div>
                                            <div className="flex gap-2">
                                                <strong className="text-slate-900 dark:text-white min-w-[120px]">Analytics dashboard:</strong>
                                                <span>Analyze generated feedback reports to track student satisfaction metrics, review open comments, and export reports for administrative meetings.</span>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            )}

                            {/* Violations Guide */}
                            {(activeSection === 'all' || activeSection === 'violations') && (
                                <Card className="rounded-2xl border-slate-200/60 dark:border-slate-800">
                                    <CardHeader className="flex flex-row items-center gap-3 space-y-0 border-b border-slate-100 pb-4 dark:border-slate-800">
                                        <div className="rounded-lg bg-rose-50 p-2.5 text-rose-600 dark:bg-rose-950/40 dark:text-rose-400">
                                            <Shield className="h-5 w-5" />
                                        </div>
                                        <div>
                                            <CardTitle className="text-base font-bold">5. Disciplinary Incidents, 5-Step SRCB Protocol & Admission Slips</CardTitle>
                                            <CardDescription className="text-xs">Incident tracking, due process calling workflow, and class entry permissions</CardDescription>
                                        </div>
                                    </CardHeader>
                                    <CardContent className="pt-6 space-y-5 text-xs leading-relaxed text-slate-600 dark:text-slate-300">
                                        <p>
                                            Oversee student disciplinary records, facilitate fair due process through the 5-Step SRCB Protocol, and manage class admission slips.
                                        </p>

                                        {/* Triage & Metric Cards */}
                                        <div className="rounded-xl border border-slate-200/80 bg-slate-50/60 p-3.5 dark:border-slate-800 dark:bg-slate-950/40">
                                            <h4 className="font-bold text-slate-900 dark:text-white text-xs mb-2">Phase Insights & Triage Cards:</h4>
                                            <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-3">
                                                <div className="rounded-lg border border-amber-200 bg-amber-50/70 p-2.5 dark:border-amber-900/40 dark:bg-amber-950/30">
                                                    <div className="font-bold text-amber-900 dark:text-amber-300">Awaiting Action (Phase 2–3)</div>
                                                    <div className="mt-0.5 text-[11px] text-amber-800/80 dark:text-amber-400">Active cases in Investigation or Hearing stages requiring staff action.</div>
                                                </div>
                                                <div className="rounded-lg border border-blue-200 bg-blue-50/70 p-2.5 dark:border-blue-900/40 dark:bg-blue-950/30">
                                                    <div className="font-bold text-blue-900 dark:text-blue-300">Pending Decision (Phase 4–5)</div>
                                                    <div className="mt-0.5 text-[11px] text-blue-800/80 dark:text-blue-400">Cases under deliberation for formal sanctions or appeal evaluation.</div>
                                                </div>
                                                <div className="rounded-lg border border-rose-200 bg-rose-50/70 p-2.5 dark:border-rose-900/40 dark:bg-rose-950/30">
                                                    <div className="font-bold text-rose-900 dark:text-rose-300">Overdue (&gt; 7 Days)</div>
                                                    <div className="mt-0.5 text-[11px] text-rose-800/80 dark:text-rose-400">SLA warning flagging cases stuck in a phase for over a week.</div>
                                                </div>
                                            </div>
                                        </div>

                                        {/* 5-Step SRCB Protocol */}
                                        <div className="space-y-3">
                                            <h4 className="font-bold text-slate-900 dark:text-white text-xs">5-Step SRCB Protocol ("If a Concern Arises"):</h4>
                                            <div className="space-y-2">
                                                <div className="flex gap-2">
                                                    <strong className="text-slate-900 dark:text-white min-w-[140px]">Step 1 (Report / Incident):</strong>
                                                    <span>Officially documents the violation, time/location, involved students, and initial evidence.</span>
                                                </div>
                                                <div className="flex gap-2">
                                                    <strong className="text-slate-900 dark:text-white min-w-[140px]">Step 2 (Investigation):</strong>
                                                    <span>SAO/Discipline officers review prior infractions, interview witnesses, and evaluate handbook rules (24–48h).</span>
                                                </div>
                                                <div className="flex gap-2">
                                                    <strong className="text-slate-900 dark:text-white min-w-[140px]">Step 3 (Meeting / Hearing):</strong>
                                                    <span>Issues official Calling Slips / Summons to student & parents, and convenes the hearing conference (3–5 days).</span>
                                                </div>
                                                <div className="flex gap-2">
                                                    <strong className="text-slate-900 dark:text-white min-w-[140px]">Step 4 (Outcome / Sanction):</strong>
                                                    <span>Disciplinary board deliberates and issues formal sanction notice (Warning, Suspension, Exclusion, Expulsion).</span>
                                                </div>
                                                <div className="flex gap-2">
                                                    <strong className="text-slate-900 dark:text-white min-w-[140px]">Step 5 (Appeal / Closure):</strong>
                                                    <span>Handles reconsideration petitions, verifies penalty compliance, and archives the case as Resolved.</span>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Other tools */}
                                        <div className="space-y-2 pt-1 border-t border-slate-100 dark:border-slate-800">
                                            <div className="flex gap-2">
                                                <strong className="text-slate-900 dark:text-white min-w-[140px]">Admission Slips:</strong>
                                                <span>Review, approve, and issue official class entry permission slips for students returning after infractions or absences.</span>
                                            </div>
                                            <div className="flex gap-2">
                                                <strong className="text-slate-900 dark:text-white min-w-[140px]">Thermal Printing:</strong>
                                                <span>Print admission slips instantly to standard 80mm thermal receipt roll printers.</span>
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
                                            <Card key={i} className="rounded-2xl border-slate-200/60 dark:border-slate-800 bg-white/50 backdrop-blur-xs">
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
                            <Card className="rounded-2xl border-slate-200/60 bg-gradient-to-br from-blue-50/50 to-indigo-50/50 dark:border-slate-800 dark:from-slate-900 dark:to-slate-800">
                                <CardHeader>
                                    <CardTitle className="text-sm font-bold text-slate-900 dark:text-white">Technical Support</CardTitle>
                                    <CardDescription className="text-xs">Database, system configs or urgent issues</CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="flex items-center gap-3">
                                        <div className="grid h-8 w-8 place-items-center rounded-lg bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400">
                                            <Mail className="h-4 w-4" />
                                        </div>
                                        <div>
                                            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Email Contact</div>
                                            <div className="text-xs font-semibold text-slate-800 dark:text-slate-200">dsa@srcb.edu.ph</div>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <div className="grid h-8 w-8 place-items-center rounded-lg bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400">
                                            <HelpCircle className="h-4 w-4" />
                                        </div>
                                        <div>
                                            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Office Hours</div>
                                            <div className="text-xs font-semibold text-slate-800 dark:text-slate-200">Mon - Fri: 8:00 AM - 5:00 PM</div>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>

                            {/* System Guidelines Info Alert */}
                            <Card className="rounded-2xl border-amber-100 bg-amber-50/30 p-5 dark:border-amber-900/20 dark:bg-amber-950/10">
                                <div className="flex gap-3">
                                    <div className="mt-0.5 text-amber-600 dark:text-amber-500">
                                        <FileText className="h-5 w-5" />
                                    </div>
                                    <div>
                                        <h4 className="text-xs font-bold text-amber-800 dark:text-amber-400 uppercase tracking-wider">Compliance reminder</h4>
                                        <p className="mt-1 text-[11px] leading-relaxed text-amber-900/80 dark:text-amber-300/80">
                                            Please verify student records and incident logs carefully. All logs generated are tamper-proof and constitute official student files for accreditation and compliance.
                                        </p>
                                    </div>
                                </div>
                            </Card>
                        </div>
                    </div>
                </div>
            </div>
        </AdminLayout>
    );
}
