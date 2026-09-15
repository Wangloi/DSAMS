import React, { useState, useMemo } from 'react';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Link } from '@inertiajs/react';
import {
    Search,
    LifeBuoy,
    QrCode,
    Calendar,
    Shield,
    Users,
    Printer,
    FileQuestion,
    ChevronDown,
    ChevronUp,
    ExternalLink,
    CheckCircle2,
    AlertTriangle,
    BookOpen,
    HelpCircle,
    FileText,
    Sparkles,
    ArrowRight,
    MapPin,
    Layers,
} from 'lucide-react';

export type HelpRole = 'admin' | 'program_head' | 'student';

interface DetailedHelpCenterModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    role?: HelpRole;
}

interface GuideItem {
    id: string;
    title: string;
    category: string;
    summary: string;
    badge?: string;
    steps?: string[];
    tips?: string;
    actionLink?: string;
    actionText?: string;
    roles: HelpRole[];
}

interface FaqItem {
    q: string;
    a: string;
    category: string;
    roles: HelpRole[];
}

const GUIDES: GuideItem[] = [
    // Admin Guides
    {
        id: 'admin-qr-scanner',
        title: 'Launching & Operating the QR Scanner Portal',
        category: 'attendance',
        summary: 'Set up kiosk scanners or handheld devices for real-time student check-in with sound effects and vibration feedback.',
        badge: 'Attendance Core',
        steps: [
            'Navigate to the "QR Scanner" module from the main navigation.',
            'Select the target Event from the dropdown selector.',
            'Choose between "Time-In" or "Time-Out" scanning modes.',
            'Click "Start Camera" to enable continuous high-speed barcode/QR decoding.',
            'Optionally activate Student Scanner Portal for self-service student scanner delegation.',
        ],
        tips: 'Enable "Audio & Haptic Feedback" for instant audible confirmation on each successful check-in.',
        actionLink: '/admin/qr-scanner',
        actionText: 'Open QR Scanner',
        roles: ['admin'],
    },
    {
        id: 'admin-geofence',
        title: 'Configuring GPS Geofenced Check-In',
        category: 'attendance',
        summary: 'Restrict event attendance check-ins within physical campus venue boundaries using GPS coordinates.',
        badge: 'Security',
        steps: [
            'When creating or editing an Event, go to Step 2 (Location & Geofencing).',
            'Toggle "Enable Geofencing".',
            'Pick the venue coordinates using the interactive Campus Map Selector.',
            'Set the Geofence Radius (recommended: 50m to 150m depending on venue size).',
            'Students attempting to check in outside this boundary will be prevented with an out-of-range alert.',
        ],
        tips: 'Advise students to ensure high-accuracy GPS and location permissions are enabled on their mobile browsers.',
        actionLink: '/admin/events',
        actionText: 'Manage Events',
        roles: ['admin'],
    },
    {
        id: 'admin-activity-plans',
        title: 'Reviewing & Approving Program Head Activity Plans',
        category: 'events',
        summary: 'Review proposed department events, inspect attached activity proposals (PDF/Word), and resolve schedule conflicts.',
        badge: 'Approvals',
        steps: [
            'Navigate to "Events Management" and filter by "Pending Approvals" status.',
            'Click on any pending event request to inspect venue, time, target courses, and attached Activity Proposal documents.',
            'Download the attached activity plan document directly from the details view.',
            'Click "Approve Schedule Request" to publish to the campus calendar, or "Reject Request" with an optional note.',
        ],
        tips: 'The system automatically detects venue overlaps on the same date/time and warns you before approval.',
        actionLink: '/admin/events?status=pending',
        actionText: 'View Pending Requests',
        roles: ['admin'],
    },
    {
        id: 'admin-srcb-workflow',
        title: '5-Step SRCB Incident Resolution Protocol',
        category: 'violations',
        summary: 'Standard Operating Procedure (SOP) for tracking student infractions, issuing calling slips, and conducting parent hearings.',
        badge: 'Discipline SOP',
        steps: [
            'Phase 1 (Report Incident): Log the violation, classify offense severity (Minor / Major), and attach initial evidence.',
            'Phase 2 (Investigation): Fact-finding period within 24-48 hours. Gather statements and witness remarks.',
            'Phase 3 (Hearing / Calling Slip): Issue an official Calling Slip summoning the student and parent/guardian to the Prefect office.',
            'Phase 4 (Outcome / Sanctions): Determine restorative sanctions (warning, community service, suspension) aligned with the Student Handbook.',
            'Phase 5 (Appeal / Closure): Review completion of sanction obligations and officially archive/close the case record.',
        ],
        tips: 'Keep track of "Overdue (> 7 days)" cards on the Incidents dashboard to ensure student due process deadlines are strictly met.',
        actionLink: '/admin/incidents-violations',
        actionText: 'Incidents & Violations',
        roles: ['admin'],
    },
    {
        id: 'admin-thermal-printing',
        title: 'Printing Official Calling & Admission Slips on Thermal Printers',
        category: 'printing',
        summary: 'Format and print 80mm thermal receipt slips for immediate hand-off to students and parents.',
        badge: 'Hardware',
        steps: [
            'Click the "Print Slip" button on any incident record, disciplinary action, or admission slip.',
            'In the browser print window, select your 80mm Thermal Receipt Printer (e.g. POS-80, Epson TM-T88).',
            'Set Margins to "None" or "Minimum" for seamless thermal receipts without white space.',
            'Ensure "Background Graphics" is enabled so barcode headers and logos render crisp and dark.',
        ],
        tips: 'The slip layout automatically optimizes text contrast, university logo, barcode, and signature lines.',
        actionLink: '/admin/incidents-violations',
        actionText: 'Print Calling Slips',
        roles: ['admin'],
    },
    {
        id: 'admin-bulk-import',
        title: 'Bulk Importing Students via CSV / Excel',
        category: 'users',
        summary: 'Quickly onboard hundreds of student accounts with automatic department and year level assignment.',
        badge: 'Data Tools',
        steps: [
            'Go to "Manage Users" and click "Bulk Add Students".',
            'Click "Download CSV Template" to get the exact header formatting.',
            'Fill in Student ID, First Name, Last Name, Email, Program, and Year Level.',
            'Drag and drop the completed CSV file into the upload zone and click "Process Import".',
            'The system validates duplicate IDs and emails before saving.',
        ],
        tips: 'Ensure Student IDs follow the standard school format (e.g. 2024-00123) to avoid duplicate registration errors.',
        actionLink: '/admin/manage-users',
        actionText: 'Open User Management',
        roles: ['admin'],
    },

    // Program Head Guides
    {
        id: 'ph-activity-plan',
        title: 'Submitting Activity Plans & Proposing Department Events',
        category: 'events',
        summary: 'Propose semester activities, reserve venues, and attach official activity proposal documentation for Admin sign-off.',
        badge: 'Calendar',
        steps: [
            'Navigate to "Calendar & Events" on your navigation bar.',
            'Click the "Upload Activity Plan" button or click directly on any date in the calendar view.',
            'Enter Event Title, Proposed Venue, Date, and Start Time.',
            'Attach your official proposal document (PDF, Word DOC/DOCX, or Image up to 20MB).',
            'Click "Submit Request". System Administrators are automatically notified to review and approve.',
        ],
        tips: 'Once approved by the Admin, your event appears live on all student dashboards and calendars.',
        actionLink: '/program-head/calendar-events',
        actionText: 'Go to Calendar & Events',
        roles: ['program_head'],
    },
    {
        id: 'ph-student-directory',
        title: 'Navigating & Monitoring Student Directory',
        category: 'students',
        summary: 'Access student department rosters, track active enrollments, and check disciplinary records.',
        badge: 'Students',
        steps: [
            'Go to "Student Directory" from the Program Head dashboard.',
            'Use the search bar to find students by Name or Student ID.',
            'Filter by Year Level (1st Year, 2nd Year, 3rd Year, 4th Year).',
            'Click on any student row to view their academic status and past incident history.',
        ],
        tips: 'Export student lists as CSV anytime for departmental record keeping and meetings.',
        actionLink: '/program-head/students',
        actionText: 'Open Student Directory',
        roles: ['program_head'],
    },
    {
        id: 'ph-attendance-monitoring',
        title: 'Tracking Department Event Attendance & Turnout',
        category: 'attendance',
        summary: 'Review real-time scan metrics, percentage turnout, and student check-in timestamps for your program.',
        badge: 'Analytics',
        steps: [
            'Navigate to "Attendance Monitoring" or open any event from "Calendar & Events".',
            'View the real-time attendance counter showing Present vs Expected attendees.',
            'Filter by year level to analyze program participation rates.',
            'Export detailed attendance sheets for clearance and activity accreditation.',
        ],
        tips: 'You can monitor live scan progress as attendance scanning takes place in real time.',
        actionLink: '/program-head/attendance',
        actionText: 'Attendance Telemetry',
        roles: ['program_head'],
    },

    // Student Guides
    {
        id: 'student-qr-scan',
        title: 'Checking In to Events Using Digital QR ID',
        category: 'attendance',
        summary: 'Present your personalized student QR ID or scan dynamic event QR codes to log your attendance.',
        badge: 'Student ID',
        steps: [
            'Open your Student Dashboard on your smartphone or mobile device.',
            'Tap "My QR Pass / ID" to display your unique high-contrast barcode.',
            'Present your screen to the student scanner marshal at the venue entrance.',
            'Listen for the confirmation chime or view your attendance history update instantly.',
        ],
        tips: 'Turn up your phone screen brightness for fast, seamless scanning under any lighting.',
        actionLink: '/student/dashboard',
        actionText: 'View My Dashboard',
        roles: ['student'],
    },
    {
        id: 'student-evaluation',
        title: 'Completing Event & Seminar Feedback Evaluations',
        category: 'evaluations',
        summary: 'Provide valuable feedback on attended seminars and campus activities to receive evaluation certificates.',
        badge: 'Surveys',
        steps: [
            'After attending an event, go to "Activity Feedback" on your menu.',
            'Click on the completed event to open the Evaluation Survey form.',
            'Rate speakers, venue organization, and overall satisfaction on the 5-point scale.',
            'Submit your review to finalize your attendance accreditation.',
        ],
        tips: 'Completing evaluations helps organizers improve future activities and clears semester clearance holds.',
        actionLink: '/student/evaluations',
        actionText: 'Activity Feedback',
        roles: ['student'],
    },
];

const FAQS: FaqItem[] = [
    {
        q: "What should I do if a student's QR code fails to scan?",
        a: "Ensure the camera has proper lighting and that the student's screen brightness is turned up. If it still fails, check-in the student manually via the Attendance list on the specific event page.",
        category: 'attendance',
        roles: ['admin', 'program_head'],
    },
    {
        q: "How does geofencing restriction work for event check-in?",
        a: "Geofencing uses coordinates (Latitude & Longitude) and a radius in meters. When activated, students can only check in if their GPS report falls within the specified radius. If a student gets a 'location error', ask them to enable GPS high-accuracy location services.",
        category: 'attendance',
        roles: ['admin', 'program_head', 'student'],
    },
    {
        q: "How do I print admission slips on a thermal printer?",
        a: "Simply click 'Print' on any admission slip. The print dialog is automatically configured for standard 80mm thermal receipt roll paper. Ensure your printer paper margins are set to 'None' in your browser's print options for optimal formatting.",
        category: 'printing',
        roles: ['admin'],
    },
    {
        q: "How can I bulk import multiple students into the system?",
        a: "Navigate to Manage Users, click 'Bulk Add Students', download the CSV template, fill in the student records (Student ID, Name, Program, Year), and upload the spreadsheet.",
        category: 'users',
        roles: ['admin'],
    },
    {
        q: "What do the 'Awaiting Action', 'Pending Decision', and 'Overdue' cards indicate in Incidents & Violations?",
        a: "'Awaiting Action' tracks active cases in Investigation/Hearing (Phases 2–3) needing officer response. 'Pending Decision' tracks cases in Sanction/Appeal deliberation (Phases 4–5). 'Overdue (> 7 days)' flags cases stalled in their current step for more than a week to protect student due process.",
        category: 'violations',
        roles: ['admin'],
    },
    {
        q: "How do I upload an activity plan for my department?",
        a: "Go to Calendar & Events in the Program Head portal, click 'Upload Activity Plan', fill in the event details and venue, and attach your PDF, DOCX, or Image proposal document (up to 20MB). Once submitted, admins will review and approve.",
        category: 'events',
        roles: ['program_head'],
    },
    {
        q: "How do I clear my disciplinary clearance holds?",
        a: "Check your Active Infractions in the student portal, attend your scheduled hearing with the Prefect of Discipline, complete your assigned restorative sanction, and ensure the officer signs off on your case resolution.",
        category: 'violations',
        roles: ['student'],
    },
];

export function DetailedHelpCenterModal({
    open,
    onOpenChange,
    role = 'admin',
}: DetailedHelpCenterModalProps) {
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedCategory, setSelectedCategory] = useState<string>('all');
    const [expandedGuideId, setExpandedGuideId] = useState<string | null>(null);
    const [expandedFaqIndex, setExpandedFaqIndex] = useState<number | null>(null);

    // Available categories based on role
    const categories = useMemo(() => {
        if (role === 'admin') {
            return [
                { id: 'all', label: 'All Topics', icon: Layers },
                { id: 'attendance', label: 'QR & Attendance', icon: QrCode },
                { id: 'events', label: 'Events & Plans', icon: Calendar },
                { id: 'violations', label: 'Incidents & SRCB', icon: Shield },
                { id: 'printing', label: 'Thermal Printing', icon: Printer },
                { id: 'users', label: 'Users & Imports', icon: Users },
                { id: 'faqs', label: 'FAQs & Troubleshooting', icon: FileQuestion },
            ];
        }
        if (role === 'program_head') {
            return [
                { id: 'all', label: 'All Topics', icon: Layers },
                { id: 'events', label: 'Calendar & Proposals', icon: Calendar },
                { id: 'students', label: 'Student Directory', icon: Users },
                { id: 'attendance', label: 'Attendance Telemetry', icon: QrCode },
                { id: 'faqs', label: 'FAQs & Support', icon: FileQuestion },
            ];
        }
        return [
            { id: 'all', label: 'All Topics', icon: Layers },
            { id: 'attendance', label: 'QR Scans & Attendance', icon: QrCode },
            { id: 'evaluations', label: 'Activity Feedback', icon: FileText },
            { id: 'violations', label: 'Clearance & Infractions', icon: Shield },
            { id: 'faqs', label: 'FAQs & Help', icon: FileQuestion },
        ];
    }, [role]);

    // Filtered Guides
    const filteredGuides = useMemo(() => {
        const query = searchQuery.trim().toLowerCase();
        return GUIDES.filter((g) => {
            if (!g.roles.includes(role)) return false;
            if (selectedCategory !== 'all' && selectedCategory !== 'faqs' && g.category !== selectedCategory) {
                return false;
            }
            if (!query) return true;
            return (
                g.title.toLowerCase().includes(query) ||
                g.summary.toLowerCase().includes(query) ||
                (g.steps && g.steps.some((s) => s.toLowerCase().includes(query))) ||
                (g.tips && g.tips.toLowerCase().includes(query))
            );
        });
    }, [role, selectedCategory, searchQuery]);

    // Filtered FAQs
    const filteredFaqs = useMemo(() => {
        const query = searchQuery.trim().toLowerCase();
        return FAQS.filter((f) => {
            if (!f.roles.includes(role)) return false;
            if (selectedCategory !== 'all' && selectedCategory !== 'faqs' && f.category !== selectedCategory) {
                return false;
            }
            if (!query) return true;
            return (
                f.q.toLowerCase().includes(query) ||
                f.a.toLowerCase().includes(query)
            );
        });
    }, [role, selectedCategory, searchQuery]);

    const handleActionClick = () => {
        onOpenChange(false);
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="flex max-h-[94vh] sm:max-h-[88vh] w-[96vw] max-w-[96vw] sm:max-w-2xl md:max-w-4xl lg:max-w-5xl xl:max-w-6xl flex-col overflow-hidden rounded-2xl sm:rounded-3xl border border-slate-200/80 bg-white p-0 text-slate-900 shadow-2xl dark:border-slate-800 dark:bg-[#0B192C] dark:text-white">
                {/* Header Banner */}
                <div className="relative shrink-0 overflow-hidden bg-gradient-to-r from-[#0b1c5c] via-[#1e3a8a] to-[#2563eb] p-4 sm:p-6 lg:p-7 text-white">
                    <div className="pointer-events-none absolute -top-24 -right-24 h-64 w-64 rounded-full bg-blue-400/15 blur-3xl" />
                    <div className="pointer-events-none absolute -bottom-16 -left-16 h-48 w-48 rounded-full bg-indigo-500/20 blur-2xl" />

                    <div className="relative flex flex-col gap-3 sm:gap-4">
                        <div className="flex items-start justify-between gap-3">
                            <div className="flex items-center gap-2.5 sm:gap-3.5">
                                <div className="grid h-9 w-9 sm:h-11 sm:w-11 shrink-0 place-items-center rounded-xl sm:rounded-2xl bg-white/10 text-white backdrop-blur-md shadow-inner">
                                    <LifeBuoy className="h-5 w-5 sm:h-6 sm:w-6" />
                                </div>
                                <div>
                                    <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                                        <DialogTitle className="text-base font-black tracking-tight text-white sm:text-lg lg:text-xl">
                                            DSAMS Help & Guidelines Center
                                        </DialogTitle>
                                        <Badge className="bg-blue-400/20 text-blue-100 border-blue-300/30 text-[9px] sm:text-[10px] font-bold uppercase tracking-wider px-2 py-0.5">
                                            {role === 'admin' ? 'Administrator' : role === 'program_head' ? 'Program Head' : 'Student Portal'}
                                        </Badge>
                                    </div>
                                    <DialogDescription className="mt-0.5 text-[11px] sm:text-xs text-blue-100/80 line-clamp-1 sm:line-clamp-none">
                                        Interactive step-by-step documentation, feature manuals, and troubleshooting guides
                                    </DialogDescription>
                                </div>
                            </div>
                        </div>

                        {/* Search Input */}
                        <div className="relative mt-0.5 sm:mt-1">
                            <Search className="absolute left-3 sm:left-3.5 top-1/2 h-3.5 w-3.5 sm:h-4 sm:w-4 -translate-y-1/2 text-blue-200/70" />
                            <Input
                                placeholder="Search guides, step-by-step instructions, thermal printing, QR scans..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="h-9 sm:h-11 w-full rounded-lg sm:rounded-xl border-white/20 bg-white/10 pl-8 sm:pl-10 pr-12 sm:pr-14 text-xs font-medium text-white placeholder:text-blue-200/60 backdrop-blur-md focus:border-white focus:bg-white/15 focus:ring-2 focus:ring-white/20"
                            />
                            {searchQuery && (
                                <button
                                    type="button"
                                    onClick={() => setSearchQuery('')}
                                    className="absolute right-2.5 sm:right-3 top-1/2 -translate-y-1/2 text-[11px] sm:text-xs font-semibold text-blue-200 hover:text-white px-1.5 py-0.5 rounded-md hover:bg-white/10"
                                >
                                    Clear
                                </button>
                            )}
                        </div>
                    </div>
                </div>

                {/* Category Navigation Bar (Mobile Dropdown Selector + Tablet/Desktop Pill Tabs) */}
                <div className="shrink-0 border-b border-slate-200/80 bg-slate-50/90 px-3 py-2 sm:px-6 sm:py-2.5 dark:border-slate-800 dark:bg-slate-900/80">
                    {/* Mobile (< 640px): Dedicated full-width dropdown selector */}
                    <div className="sm:hidden">
                        <div className="relative flex items-center">
                            <div className="pointer-events-none absolute left-3 flex items-center text-blue-600 dark:text-blue-400">
                                {(() => {
                                    const activeCat =
                                        categories.find(
                                            (c) => c.id === selectedCategory,
                                        ) || categories[0];
                                    const IconComp = activeCat.icon;
                                    return <IconComp className="h-4 w-4" />;
                                })()}
                            </div>
                            <select
                                value={selectedCategory}
                                onChange={(e) => {
                                    setSelectedCategory(e.target.value);
                                    setExpandedGuideId(null);
                                }}
                                aria-label="Select Category"
                                className="h-10 w-full appearance-none rounded-xl border border-slate-200/90 bg-white pl-9 pr-9 text-xs font-bold text-slate-800 shadow-xs focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:border-slate-700/80 dark:bg-slate-800 dark:text-white"
                            >
                                {categories.map((cat) => (
                                    <option
                                        key={cat.id}
                                        value={cat.id}
                                        className="dark:bg-slate-800 py-1"
                                    >
                                        {cat.label}
                                    </option>
                                ))}
                            </select>
                            <ChevronDown className="pointer-events-none absolute right-3 h-4 w-4 text-slate-400" />
                        </div>
                    </div>

                    {/* Tablet & Desktop (>= 640px): Responsive Wrapping Pill Tabs */}
                    <div className="hidden sm:flex items-center gap-1.5 sm:gap-2 sm:flex-wrap">
                        {categories.map((cat) => {
                            const IconComponent = cat.icon;
                            const isActive = selectedCategory === cat.id;
                            return (
                                <button
                                    key={cat.id}
                                    type="button"
                                    onClick={() => {
                                        setSelectedCategory(cat.id);
                                        setExpandedGuideId(null);
                                    }}
                                    className={`inline-flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-bold transition-all duration-150 active:scale-95 ${
                                        isActive
                                            ? 'bg-blue-600 text-white shadow-sm shadow-blue-500/25 ring-2 ring-blue-500/20'
                                            : 'bg-white/70 text-slate-600 border border-slate-200/80 hover:bg-slate-100 hover:text-slate-900 dark:bg-slate-800/60 dark:border-slate-700/60 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-white'
                                    }`}
                                >
                                    <IconComponent
                                        className={`h-3.5 w-3.5 ${isActive ? 'text-white' : 'text-slate-400 dark:text-slate-400'}`}
                                    />
                                    <span>{cat.label}</span>
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* Modal Body Content (Scrollable & Responsive) */}
                <div className="flex-1 overflow-y-auto min-h-0 space-y-4 sm:space-y-6 p-3 sm:p-5 md:p-6 bg-slate-50/40 dark:bg-slate-950/30">
                    {/* Active Guides Section */}
                    {selectedCategory !== 'faqs' && filteredGuides.length > 0 && (
                        <div className="space-y-2.5 sm:space-y-3">
                            <div className="flex items-center justify-between">
                                <h3 className="text-[11px] sm:text-xs font-black uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                                    <BookOpen className="h-3.5 w-3.5 text-blue-500" />
                                    Step-by-Step Feature Walkthroughs ({filteredGuides.length})
                                </h3>
                            </div>

                            <div className="space-y-2.5 sm:space-y-3">
                                {filteredGuides.map((guide) => {
                                    const isExpanded = expandedGuideId === guide.id;
                                    return (
                                        <div
                                            key={guide.id}
                                            className="overflow-hidden rounded-xl sm:rounded-2xl border border-slate-200/80 bg-white shadow-xs sm:shadow-sm transition-all duration-200 hover:border-blue-300 dark:border-slate-800 dark:bg-[#0B192C]/70 dark:hover:border-blue-500/50"
                                        >
                                            <button
                                                type="button"
                                                onClick={() =>
                                                    setExpandedGuideId(
                                                        isExpanded ? null : guide.id,
                                                    )
                                                }
                                                className="flex w-full items-start justify-between gap-2.5 sm:gap-3 p-3 sm:p-4 text-left transition-colors hover:bg-slate-50/50 dark:hover:bg-slate-800/30"
                                            >
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                                                        {guide.badge && (
                                                            <Badge className="bg-blue-50 text-blue-700 border-blue-200 text-[9px] sm:text-[10px] font-bold dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-800">
                                                                {guide.badge}
                                                            </Badge>
                                                        )}
                                                        <h4 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white leading-snug">
                                                            {guide.title}
                                                        </h4>
                                                    </div>
                                                    <p className="mt-1 text-[11px] sm:text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                                                        {guide.summary}
                                                    </p>
                                                </div>
                                                <div className="ml-1 sm:ml-2 mt-0.5 sm:mt-1 shrink-0 rounded-lg bg-slate-100 p-1 text-slate-500 dark:bg-slate-800 dark:text-slate-400">
                                                    {isExpanded ? (
                                                        <ChevronUp className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                                                    ) : (
                                                        <ChevronDown className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                                                    )}
                                                </div>
                                            </button>

                                            {/* Expanded Step Details (Responsive grid on larger viewports) */}
                                            {isExpanded && (
                                                <div className="border-t border-slate-100 bg-slate-50/50 p-3.5 sm:p-5 dark:border-slate-800/80 dark:bg-slate-900/40 space-y-3.5 sm:space-y-4">
                                                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-3.5 sm:gap-4">
                                                        {/* Steps Column */}
                                                        <div className={guide.tips || guide.actionLink ? "lg:col-span-2 space-y-2" : "lg:col-span-3 space-y-2"}>
                                                            {guide.steps && (
                                                                <>
                                                                    <span className="text-[10px] sm:text-[11px] font-black uppercase tracking-wider text-slate-400">
                                                                        Instructions & Steps
                                                                    </span>
                                                                    <div className="space-y-1.5 sm:space-y-2">
                                                                        {guide.steps.map((step, idx) => (
                                                                            <div
                                                                                key={idx}
                                                                                className="flex items-start gap-2 sm:gap-2.5 rounded-lg sm:rounded-xl bg-white p-2 sm:p-2.5 text-[11px] sm:text-xs text-slate-700 shadow-xs dark:bg-slate-800/60 dark:text-slate-200 border border-slate-200/60 dark:border-slate-700/60"
                                                                            >
                                                                                <span className="flex h-4.5 w-4.5 sm:h-5 sm:w-5 shrink-0 items-center justify-center rounded-full bg-blue-600 text-[9px] sm:text-[10px] font-bold text-white">
                                                                                    {idx + 1}
                                                                                </span>
                                                                                <span className="mt-0.5 leading-relaxed">
                                                                                    {step}
                                                                                </span>
                                                                            </div>
                                                                        ))}
                                                                    </div>
                                                                </>
                                                            )}
                                                        </div>

                                                        {/* Side Column: Pro Tip & Action */}
                                                        {(guide.tips || guide.actionLink) && (
                                                            <div className="flex flex-col justify-between gap-3 lg:col-span-1">
                                                                {guide.tips && (
                                                                    <div className="flex items-start gap-2 sm:gap-2.5 rounded-xl border border-amber-200 bg-amber-50/70 p-2.5 sm:p-3 text-amber-800 dark:border-amber-900/40 dark:bg-amber-950/30 dark:text-amber-300">
                                                                        <Sparkles className="h-3.5 w-3.5 sm:h-4 sm:w-4 shrink-0 text-amber-600 dark:text-amber-400 mt-0.5" />
                                                                        <div className="text-[11px] sm:text-xs">
                                                                            <span className="font-bold">Pro Tip: </span>
                                                                            <span className="leading-relaxed">{guide.tips}</span>
                                                                        </div>
                                                                    </div>
                                                                )}

                                                                {guide.actionLink && (
                                                                    <div className="flex justify-end pt-1">
                                                                        <Link
                                                                            href={guide.actionLink}
                                                                            onClick={handleActionClick}
                                                                            className="w-full sm:w-auto inline-flex justify-center items-center gap-1.5 rounded-xl bg-blue-600 px-3.5 py-2 text-xs font-bold text-white shadow-sm transition-all hover:bg-blue-700 hover:shadow-md"
                                                                        >
                                                                            <span>{guide.actionText || 'Open Module'}</span>
                                                                            <ExternalLink className="h-3.5 w-3.5" />
                                                                        </Link>
                                                                    </div>
                                                                )}
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    {/* FAQs Section (Responsive 2-column on desktop / tablet) */}
                    {filteredFaqs.length > 0 && (
                        <div className="space-y-2.5 sm:space-y-3">
                            <h3 className="text-[11px] sm:text-xs font-black uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                                <FileQuestion className="h-3.5 w-3.5 text-amber-500" />
                                Frequently Asked Questions & Troubleshooting ({filteredFaqs.length})
                            </h3>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 sm:gap-3">
                                {filteredFaqs.map((faq, idx) => {
                                    const isFaqExpanded = expandedFaqIndex === idx;
                                    return (
                                        <div
                                            key={idx}
                                            className="overflow-hidden rounded-xl border border-slate-200/80 bg-white shadow-xs transition-all dark:border-slate-800 dark:bg-[#0B192C]/60"
                                        >
                                            <button
                                                type="button"
                                                onClick={() =>
                                                    setExpandedFaqIndex(
                                                        isFaqExpanded ? null : idx,
                                                    )
                                                }
                                                className="flex w-full items-center justify-between gap-2.5 sm:gap-3 p-3 sm:p-3.5 text-left text-[11px] sm:text-xs font-bold text-slate-800 hover:bg-slate-50/50 dark:text-slate-200 dark:hover:bg-slate-800/30"
                                            >
                                                <div className="flex items-center gap-2 min-w-0">
                                                    <span className="text-blue-500 font-black">Q:</span>
                                                    <span className="line-clamp-2">{faq.q}</span>
                                                </div>
                                                <div className="shrink-0 text-slate-400">
                                                    {isFaqExpanded ? (
                                                        <ChevronUp className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                                                    ) : (
                                                        <ChevronDown className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                                                    )}
                                                </div>
                                            </button>

                                            {isFaqExpanded && (
                                                <div className="border-t border-slate-100 bg-slate-50/50 p-3 sm:p-3.5 text-[11px] sm:text-xs text-slate-600 leading-relaxed dark:border-slate-800 dark:bg-slate-900/40 dark:text-slate-300">
                                                    <div className="flex items-start gap-2">
                                                        <span className="text-emerald-500 font-bold">A:</span>
                                                        <span className="leading-relaxed">{faq.a}</span>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    {/* Empty Search State */}
                    {filteredGuides.length === 0 && filteredFaqs.length === 0 && (
                        <div className="rounded-xl sm:rounded-2xl border border-slate-200/80 bg-white p-6 sm:p-8 text-center shadow-xs sm:shadow-sm dark:border-slate-800 dark:bg-slate-900/60">
                            <div className="mx-auto mb-2.5 sm:mb-3 flex h-10 w-10 sm:h-12 sm:w-12 items-center justify-center rounded-xl sm:rounded-2xl bg-slate-100 dark:bg-slate-800">
                                <HelpCircle className="h-5 w-5 sm:h-6 sm:w-6 text-slate-400" />
                            </div>
                            <h4 className="text-xs sm:text-sm font-bold text-slate-800 dark:text-white">
                                No matching guides found
                            </h4>
                            <p className="mt-1 text-[11px] sm:text-xs text-slate-500 dark:text-slate-400">
                                Try searching for different terms like "QR", "Thermal printer", "Activity plan", or "Violations".
                            </p>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                    setSearchQuery('');
                                    setSelectedCategory('all');
                                }}
                                className="mt-3.5 sm:mt-4 rounded-xl text-xs font-semibold"
                            >
                                Reset Search Filters
                            </Button>
                        </div>
                    )}
                </div>

                {/* Footer Actions (Responsive flex stacking on mobile) */}
                <div className="flex flex-col-reverse sm:flex-row items-center justify-between gap-2.5 sm:gap-3 border-t border-slate-200/80 bg-slate-50 px-4 py-3 sm:px-6 sm:py-3.5 dark:border-slate-800 dark:bg-slate-900/90 text-center sm:text-left">
                    <p className="text-[10px] sm:text-[11px] text-slate-500 dark:text-slate-400">
                        Need additional administrative assistance? Contact the ICT & Prefect Support Desk.
                    </p>
                    <Button
                        variant="outline"
                        onClick={() => onOpenChange(false)}
                        className="w-full sm:w-auto h-8 sm:h-9 rounded-xl border-slate-300 text-xs font-semibold dark:border-slate-700"
                    >
                        Close Help Center
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}

export default DetailedHelpCenterModal;
