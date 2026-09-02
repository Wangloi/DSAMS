import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { programHeadDashboard, programHeadHelp } from '@/routes';
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
import ProgramHeadLayout from '../components/ProgramHeadLayout';

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Dashboard', href: programHeadDashboard() },
    { title: 'Help & Guidelines', href: programHeadHelp() },
];

export default function ProgramHeadHelpPage() {
    const [activeSection, setActiveSection] = useState<'all' | 'roster' | 'attendance' | 'violations' | 'reports' | 'faqs'>('all');

    const sections = [
        { id: 'roster', title: 'Student Roster', icon: Users, color: 'text-blue-500 bg-blue-50 dark:bg-blue-950/40 dark:text-blue-400' },
        { id: 'attendance', title: 'Attendance Logs', icon: QrCode, color: 'text-emerald-500 bg-emerald-50 dark:bg-emerald-950/40 dark:text-emerald-400' },
        { id: 'violations', title: 'Violations & Clearance', icon: Shield, color: 'text-rose-500 bg-rose-50 dark:bg-rose-950/40 dark:text-rose-400' },
        { id: 'reports', title: 'Reports & Analytics', icon: FileText, color: 'text-purple-500 bg-purple-50 dark:bg-purple-950/40 dark:text-purple-400' },
        { id: 'faqs', title: 'FAQs & Support', icon: FileQuestion, color: 'text-amber-500 bg-amber-50 dark:bg-amber-950/40 dark:text-amber-400' },
    ];

    const faqs = [
        {
            q: "How do I approve student profile verification requests?",
            a: "Go to your Student Roster tab. Students awaiting validation will appear with a yellow verification status. Use the checkboxes to select students, then click the 'Bulk Approve Verification' button."
        },
        {
            q: "Can I manage violations for students outside my department?",
            a: "No, Program Heads are assigned specific departments. You will only see, record, and resolve violations or clearances for students enrolled within your designated program courses."
        },
        {
            q: "Can program heads create new campus events?",
            a: "Creating and scheduling major campus-wide events is done by administrators or CSG representatives. Program Heads monitor and manage logs, department filters, and reports for these events."
        },
        {
            q: "How do I export attendance reports for my course?",
            a: "Go to Reports, filter the event or course, and click 'Export CSV'. You can also print physical summaries styled for documentation directly by clicking 'Print'."
        }
    ];

    return (
        <ProgramHeadLayout breadcrumbs={breadcrumbs}>
            <Head title="Program Head System Guide" />

            <div className="min-h-[calc(100vh-4rem)] bg-slate-50 dark:bg-slate-900 pb-12">
                <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-6 py-6">
                    {/* Header Banner */}
                    <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#0c2d66] via-[#103875] to-[#1e40af] p-6 text-white shadow-xl">
                        <div className="absolute -right-8 -top-8 h-32 w-32 rounded-full bg-white/5 pointer-events-none" />
                        <div className="absolute right-12 bottom-0 h-48 w-48 rounded-full bg-blue-400/10 blur-2xl pointer-events-none" />
                        <div className="relative flex flex-col gap-4 sm:flex-row sm:items-center">
                            <div className="flex items-center gap-4">
                                <div className="grid h-12 w-12 place-items-center rounded-xl bg-white/10 text-white backdrop-blur-md">
                                    <LifeBuoy className="h-6 w-6" />
                                </div>
                                <div>
                                    <h1 className="text-xl font-bold sm:text-2xl">Program Head Help & Guidelines</h1>
                                    <p className="mt-0.5 text-xs text-blue-200/80 sm:text-sm">
                                        Operational manual, department student roster guidelines, and evaluation telemetry support.
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
                            {/* Student Roster Guide */}
                            {(activeSection === 'all' || activeSection === 'roster') && (
                                <Card className="rounded-2xl border-slate-200/60 dark:border-slate-800">
                                    <CardHeader className="flex flex-row items-center gap-3 space-y-0 border-b border-slate-100 pb-4 dark:border-slate-800">
                                        <div className="rounded-lg bg-blue-50 p-2.5 text-blue-600 dark:bg-blue-950/40 dark:text-blue-400">
                                            <Users className="h-5 w-5" />
                                        </div>
                                        <div>
                                            <CardTitle className="text-base font-bold">1. Student Roster & Verification</CardTitle>
                                            <CardDescription className="text-xs">Manage department enrollments and approvals</CardDescription>
                                        </div>
                                    </CardHeader>
                                    <CardContent className="pt-6 space-y-4 text-xs leading-relaxed text-slate-600 dark:text-slate-300">
                                        <p>
                                            As a Program Head, you have administrative command over student profiles associated with your department (e.g. BSIT).
                                        </p>
                                        <div className="space-y-2">
                                            <div className="flex gap-2">
                                                <strong className="text-slate-900 dark:text-white min-w-[120px]">Roster Tracking:</strong>
                                                <span>Search, sort, and review student lists. Check profile data, student IDs, and status.</span>
                                            </div>
                                            <div className="flex gap-2">
                                                <strong className="text-slate-900 dark:text-white min-w-[120px]">Verification:</strong>
                                                <span>Approve student sign-ups. Go to Roster, select pending list items, and bulk-approve their profile statuses to grant access to student portals.</span>
                                            </div>
                                            <div className="flex gap-2">
                                                <strong className="text-slate-900 dark:text-white min-w-[120px]">Profile Audits:</strong>
                                                <span>Verify specific course details or year levels. You can update student statuses if necessary to maintain compliance.</span>
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
                                            <CardTitle className="text-base font-bold">2. Attendance Logs</CardTitle>
                                            <CardDescription className="text-xs">Monitor real-time event logs for your programs</CardDescription>
                                        </div>
                                    </CardHeader>
                                    <CardContent className="pt-6 space-y-4 text-xs leading-relaxed text-slate-600 dark:text-slate-300">
                                        <p>
                                            Review attendance timelines for school activities. You can monitor check-in/out stamps.
                                        </p>
                                        <div className="space-y-2">
                                            <div className="flex gap-2">
                                                <strong className="text-slate-900 dark:text-white min-w-[120px]">Real-Time Feed:</strong>
                                                <span>See logs updated instantly as students scan their QR codes. Search by name or student ID.</span>
                                            </div>
                                            <div className="flex gap-2">
                                                <strong className="text-slate-900 dark:text-white min-w-[120px]">Absentee Filters:</strong>
                                                <span>Instantly identify student list items who failed to scan or missed event check-ins to flag possible infractions.</span>
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
                                            <CardTitle className="text-base font-bold">3. Violations & Clearance</CardTitle>
                                            <CardDescription className="text-xs">Record department infractions and manage sanctions</CardDescription>
                                        </div>
                                    </CardHeader>
                                    <CardContent className="pt-6 space-y-4 text-xs leading-relaxed text-slate-600 dark:text-slate-300">
                                        <p>
                                            Maintain student discipline and log academic infractions for students under your programs.
                                        </p>
                                        <div className="space-y-2">
                                            <div className="flex gap-2">
                                                <strong className="text-slate-900 dark:text-white min-w-[120px]">Record violation:</strong>
                                                <span>Log new infractions, details, and set major/minor classifications.</span>
                                            </div>
                                            <div className="flex gap-2">
                                                <strong className="text-slate-900 dark:text-white min-w-[120px]">Clearance:</strong>
                                                <span>Check clearance status for students who completed disciplinary actions. Approve clearances to restore their standing.</span>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            )}

                            {/* Reports Guide */}
                            {(activeSection === 'all' || activeSection === 'reports') && (
                                <Card className="rounded-2xl border-slate-200/60 dark:border-slate-800">
                                    <CardHeader className="flex flex-row items-center gap-3 space-y-0 border-b border-slate-100 pb-4 dark:border-slate-800">
                                        <div className="rounded-lg bg-purple-50 p-2.5 text-purple-600 dark:bg-purple-950/40 dark:text-purple-400">
                                            <FileText className="h-5 w-5" />
                                        </div>
                                        <div>
                                            <CardTitle className="text-base font-bold">4. Reports & Analytics</CardTitle>
                                            <CardDescription className="text-xs">Generate statistics and export data</CardDescription>
                                        </div>
                                    </CardHeader>
                                    <CardContent className="pt-6 space-y-4 text-xs leading-relaxed text-slate-600 dark:text-slate-300">
                                        <p>
                                            Generate summary reports for attendance statistics and infractions to track department-level metrics.
                                        </p>
                                        <div className="space-y-2">
                                            <div className="flex gap-2">
                                                <strong className="text-slate-900 dark:text-white min-w-[120px]">Data Exports:</strong>
                                                <span>Export CSV logs filtered by course, status, or date range to run offline analysis.</span>
                                            </div>
                                            <div className="flex gap-2">
                                                <strong className="text-slate-900 dark:text-white min-w-[120px]">Print summaries:</strong>
                                                <span>Print official summaries for department meetings. Click 'Print' to format printouts for standard paper rolls or paper sheets.</span>
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
                                            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Office of Student Affairs</div>
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
                        </div>
                    </div>
                </div>
            </div>
        </ProgramHeadLayout>
    );
}
