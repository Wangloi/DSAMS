import {
    ArrowLeft,
    ArrowRight,
    Award,
    BookOpen,
    Building,
    Calendar,
    CheckCircle2,
    ChevronDown,
    ChevronRight,
    ClipboardCheck,
    ClipboardList,
    Clock,
    Download,
    ExternalLink,
    FileCheck,
    FileQuestion,
    FileText,
    GraduationCap,
    HelpCircle,
    Info,
    Layers,
    LifeBuoy,
    Lock,
    Mail,
    MapPin,
    MessageSquare,
    Phone,
    QrCode,
    Search,
    Shield,
    ShieldAlert,
    ShieldCheck,
    Smartphone,
    Sparkles,
    UserCheck,
    Users,
    X,
} from 'lucide-react';
import { useMemo, useState } from 'react';
import { Link } from '@inertiajs/react';

interface GuideItem {
    id: string;
    title: string;
    category: string;
    categoryLabel: string;
    badge: string;
    summary: string;
    icon: any;
    steps: { title: string; desc: string }[];
    proTip?: string;
    actionLink?: string;
    actionText?: string;
}

interface FaqItem {
    id: string;
    category: string;
    categoryLabel: string;
    question: string;
    answer: string;
    icon: any;
}

const CATEGORIES = [
    { id: 'all', label: 'All Guides & Topics', icon: Layers },
    { id: 'attendance', label: 'QR Attendance & GPS', icon: QrCode },
    { id: 'admission', label: 'Admission Slips', icon: ClipboardList },
    { id: 'discipline', label: 'Discipline & Violations', icon: ShieldAlert },
    { id: 'evaluations', label: 'Evaluations & Certificates', icon: Award },
    { id: 'app', label: 'PWA Mobile App', icon: Smartphone },
    { id: 'account', label: 'Account & Login', icon: Lock },
    { id: 'faculty', label: 'Program Heads & Admin', icon: GraduationCap },
];

const GUIDES: GuideItem[] = [
    {
        id: 'guide-qr-attendance',
        title: 'Recording Attendance via Dynamic QR & Self-Scan',
        category: 'attendance',
        categoryLabel: 'QR Attendance & GPS',
        badge: 'Core Feature',
        summary: 'Learn how to scan rotating event QR codes or present your digital attendance token during campus activities.',
        icon: QrCode,
        steps: [
            {
                title: 'Open your Student Portal or PWA App',
                desc: 'Log in to your account from any smartphone or tablet browser and go to your Student Dashboard.',
            },
            {
                title: 'Locate Active Event Check-in',
                desc: 'Tap on the active event card or navigate to the "Scan Attendance" camera portal.',
            },
            {
                title: 'Point Camera at the Screen QR',
                desc: 'Scan the rotating projector QR code displayed at the event venue. The dynamic token refreshes every 30 seconds to prevent shared screenshots.',
            },
            {
                title: 'Verify Instant Success Feedback',
                desc: 'You will hear an audible chime and see a green confirmation badge with your recorded timestamp and check-in status (On-Time or Late).',
            },
            {
                title: 'Remember Time-Out (Check-Out)',
                desc: 'At the conclusion of the event, repeat the scan process to log your official departure timestamp required for clearance.',
            },
        ],
        proTip: 'Ensure camera and location permissions are enabled in your browser settings for accurate instantaneous validation.',
        actionLink: '/login',
        actionText: 'Go to Attendance Portal',
    },
    {
        id: 'guide-geofence-checkin',
        title: 'Checking In via GPS Geofencing',
        category: 'attendance',
        categoryLabel: 'QR Attendance & GPS',
        badge: 'Location-Based',
        summary: 'How to check into large campus assemblies using your device native GPS location when inside venue perimeters.',
        icon: MapPin,
        steps: [
            {
                title: 'Arrive at the Event Location',
                desc: 'Be physically present within the designated venue boundary (e.g., Main Gymnasium, Auditorium, or Quadrangle).',
            },
            {
                title: 'Tap "GPS Check-In" on Dashboard',
                desc: 'Find the active event on your student timeline and tap the "GPS Check-In / Check-Out" button.',
            },
            {
                title: 'Grant Browser Location Access',
                desc: 'When prompted by your browser, tap "Allow While Using App" so your device GPS coordinates can be validated against the event perimeter.',
            },
            {
                title: 'Automated Venue Verification',
                desc: 'The system computes your distance from the venue using the high-precision Haversine formula and confirms check-in if within range.',
            },
        ],
        proTip: 'If your location accuracy is too low (>150m), move away from thick concrete walls or step into an open area for a stronger satellite fix.',
        actionLink: '/login',
        actionText: 'Open Dashboard',
    },
    {
        id: 'guide-admission-slip',
        title: 'Requesting an Admission Slip (Class Re-entry Clearance)',
        category: 'admission',
        categoryLabel: 'Admission Slips',
        badge: 'Absence Clearance',
        summary: 'Step-by-step procedure for students who were absent or tardy to obtain an official re-entry slip for subject instructors.',
        icon: ClipboardList,
        steps: [
            {
                title: 'Navigate to Admission Slips',
                desc: 'Log in to your Student Portal and select "Admission Slips" from the navigation menu.',
            },
            {
                title: 'Click "Request Admission Slip"',
                desc: 'Fill out the clearance form including date(s) of absence, subjects missed, and the specific reason (Medical, Emergency, Official School Activity, or Personal).',
            },
            {
                title: 'Upload Supporting Proof',
                desc: 'Attach required documentation such as a Medical Certificate, Parent/Guardian Excuse Letter with valid ID, or Official Travel Order.',
            },
            {
                title: 'Wait for DSA Review & Approval',
                desc: 'The Office of Student Affairs will review your application. You will receive an instant in-app notification once approved.',
            },
            {
                title: 'Present Digital or Printed Slip',
                desc: 'Open the approved slip with its verifiable security QR code on your phone to present to your subject instructors for class admission.',
            },
        ],
        proTip: 'Submit your request within 48 hours of returning to classes to avoid unexcused absence penalties according to handbook policy.',
        actionLink: '/login',
        actionText: 'Request Admission Slip',
    },
    {
        id: 'guide-violations-discipline',
        title: 'Understanding Discipline Records, Calling Slips & Sanctions',
        category: 'discipline',
        categoryLabel: 'Discipline & Violations',
        badge: 'Student Conduct',
        summary: 'How incident reports, calling notices, and community service sanction hours are tracked and cleared in the system.',
        icon: ShieldAlert,
        steps: [
            {
                title: 'Viewing Incident Notices',
                desc: 'When an incident or handbook violation is logged by campus security or faculty, it appears under your "Violations & Discipline" tab.',
            },
            {
                title: 'Responding to Calling Slips',
                desc: 'If a Calling Slip is issued, report to the Office of Student Affairs (DSA) at the scheduled appointment date and time for a counseling conference.',
            },
            {
                title: 'Reviewing Assigned Sanction Hours',
                desc: 'If corrective community service hours or counseling sessions are assigned, track completed hours and supervisor sign-offs in real time.',
            },
            {
                title: 'Certificate of Clearance Issuance',
                desc: 'Upon full completion of required corrective hours, the DSA officer marks the case as "Resolved", clearing your student record.',
            },
        ],
        proTip: 'Unresolved disciplinary cases may place a temporary hold on final clearance and graduation certificate generation.',
        actionLink: '/login',
        actionText: 'Check Discipline Status',
    },
    {
        id: 'guide-evaluations-certificates',
        title: 'Completing Event Evaluations & Downloading Certificates',
        category: 'evaluations',
        categoryLabel: 'Evaluations & Certificates',
        badge: 'Rewards & Credentials',
        summary: 'How to provide feedback on attended institutional activities and automatically receive your official Certificate of Participation.',
        icon: Award,
        steps: [
            {
                title: 'Complete Event Attendance',
                desc: 'Ensure both Time-In and Time-Out timestamps are recorded for the activity.',
            },
            {
                title: 'Access Pending Evaluations',
                desc: 'Navigate to "Evaluations" from your dashboard. Events with open evaluation surveys will be highlighted in your pending queue.',
            },
            {
                title: 'Submit Survey Responses',
                desc: 'Rate the event speakers, venue organization, and overall satisfaction on the 5-point rating scale and leave constructive feedback.',
            },
            {
                title: 'Instant Certificate Generation',
                desc: 'Immediately upon survey submission, the system generates your high-resolution PDF Certificate of Participation with a verifiable QR verification badge.',
            },
            {
                title: 'Download & Archive',
                desc: 'Save the certificate to your device or access it anytime from your "Certificates" digital portfolio tab.',
            },
        ],
        proTip: 'Completing evaluations is required before you can check into subsequent events on the academic calendar.',
        actionLink: '/login',
        actionText: 'View Certificates',
    },
    {
        id: 'guide-pwa-install',
        title: 'Installing the DSAMS Student App on Mobile (Android & iOS)',
        category: 'app',
        categoryLabel: 'PWA Mobile App',
        badge: 'Mobile App',
        summary: 'How to install DSAMS directly to your phone home screen as a standalone application without using the App Store or Google Play.',
        icon: Smartphone,
        steps: [
            {
                title: 'Android (Chrome / Edge / Samsung)',
                desc: 'Open dsa.srcbitsys.io in Chrome. Look for the "Install DSAMS App" banner on your dashboard, or tap the browser menu (⋮) and select "Install App" or "Add to Home screen".',
            },
            {
                title: 'iOS iPhone & iPad (Safari)',
                desc: 'Open dsa.srcbitsys.io in Safari. Tap the Share button (square with arrow pointing up ↑) at the bottom toolbar, scroll down, and tap "Add to Home Screen" (+).',
            },
            {
                title: 'Launch from Home Screen',
                desc: 'Open the DSAMS icon from your home screen. The app will launch in full-screen standalone mode with no browser URL bar or distractions.',
            },
            {
                title: 'Fast Offline Shell & Haptic Touch',
                desc: 'Enjoy instant loading, optimized mobile navigation bar, and instant camera access for attendance scanning.',
            },
        ],
        proTip: 'Installing the app keeps you logged in securely and ensures immediate access during high-traffic event check-in queues.',
        actionLink: '/',
        actionText: 'Launch Web App',
    },
    {
        id: 'guide-program-head-monitoring',
        title: 'Program Head: Departmental Attendance & Violation Tracking',
        category: 'faculty',
        categoryLabel: 'Program Heads & Admin',
        badge: 'Faculty Portal',
        summary: 'How Department Program Heads monitor their enrolled students, view cohort attendance metrics, and inspect violation logs.',
        icon: GraduationCap,
        steps: [
            {
                title: 'Log in with Program Head Credentials',
                desc: 'Sign in using your designated departmental account on the Unified Login screen.',
            },
            {
                title: 'Departmental Overview Dashboard',
                desc: 'View real-time visual charts showing attendance percentage by year level, active event participation, and outstanding admission slips.',
            },
            {
                title: 'Filter by Course & Year Level',
                desc: 'Navigate to "Student Directory" to inspect individual student profiles, attendance histories, and clearance statuses.',
            },
            {
                title: 'Monitor Sanctions & Calling Slips',
                desc: 'Track pending disciplinary notices involving students from your department to support student counseling and academic guidance.',
            },
        ],
        proTip: 'Export comprehensive attendance reports in CSV or Excel formats for department faculty meetings and accreditation filing.',
        actionLink: '/login',
        actionText: 'Program Head Portal',
    },
    {
        id: 'guide-admin-operations',
        title: 'Administrator: Event Management, Kiosk Scanners & Bulk Operations',
        category: 'faculty',
        categoryLabel: 'Program Heads & Admin',
        badge: 'Administrative',
        summary: 'Comprehensive management of institutional events, geofence coordinates, scanner kiosk activation, and user records.',
        icon: Building,
        steps: [
            {
                title: 'Creating an Institutional Event',
                desc: 'Go to Admin Events -> "Create Event". Define name, event date, registration cutoff times, target programs, and expected attendance.',
            },
            {
                title: 'Setting Venue Geofence Map',
                desc: 'Enable GPS Geofencing, select venue center coordinates on the interactive campus map, and specify the allowed boundary radius (e.g. 100m).',
            },
            {
                title: 'Deploying Dynamic QR Projector',
                desc: 'Click "Activate Scanner Portal" -> "Launch Rotating Dynamic QR". Project the rotating screen QR code in the auditorium for self-scanning attendees.',
            },
            {
                title: 'Real-Time Monitoring & Incident Handling',
                desc: 'Watch real-time live attendance counters, logs, and process admission clearances and disciplinary cases across all academic programs.',
            },
        ],
        proTip: 'Use the "Security Audit Log" tab to inspect all critical system operations, scan timestamps, and IP device headers.',
        actionLink: '/login',
        actionText: 'Admin Dashboard',
    },
];

const FAQS: FaqItem[] = [
    {
        id: 'faq-admission-slip-req',
        category: 'admission',
        categoryLabel: 'Admission Slips',
        question: 'Who needs to request an Admission Slip?',
        answer: 'Any student who has been absent for one or more school days, or who incurred excused tardiness, must secure an Admission Slip from the Office of Student Affairs (DSA) before subject instructors will admit them back into class.',
        icon: ClipboardList,
    },
    {
        id: 'faq-admission-slip-validity',
        category: 'admission',
        categoryLabel: 'Admission Slips',
        question: 'How do instructors verify my digital Admission Slip?',
        answer: 'Each approved Admission Slip includes a digital tamper-proof QR code. Instructors can scan the QR code with any smartphone camera to view the authenticated digital clearance record directly from the DSAMS server.',
        icon: ShieldCheck,
    },
    {
        id: 'faq-qr-fail',
        category: 'attendance',
        categoryLabel: 'QR Attendance & GPS',
        question: 'What should I do if the scanner says "Dynamic QR Code Expired"?',
        answer: 'Dynamic QR codes rotate every 30 seconds for security to prevent attendees from taking pictures and sending them to absent friends. Look up at the live projection screen and scan the fresh QR code currently displayed.',
        icon: QrCode,
    },
    {
        id: 'faq-geofence-error',
        category: 'attendance',
        categoryLabel: 'QR Attendance & GPS',
        question: 'Why am I receiving a "Geofence violation" error message?',
        answer: 'This indicates your device GPS coordinates are located outside the permitted perimeter of the event venue. Ensure you are physically at the event location and that Wi-Fi / GPS location accuracy is turned on in your device settings.',
        icon: MapPin,
    },
    {
        id: 'faq-late-attendance',
        category: 'attendance',
        categoryLabel: 'QR Attendance & GPS',
        question: 'How does the system distinguish "On-Time" vs "Late" check-in?',
        answer: 'The event registration cutoff time is set by the event organizer. If you scan in after this cutoff time, the system records your attendance status as "Late". Both On-Time and Late records count as present, but late flags appear on attendance statistics.',
        icon: Clock,
    },
    {
        id: 'faq-calling-slip',
        category: 'discipline',
        categoryLabel: 'Discipline & Violations',
        question: 'What is a Student Calling Slip and what should I do if I receive one?',
        answer: 'A Calling Slip is an official summons issued by the Office of Student Affairs regarding an inquiry, counseling appointment, or handbook violation report. Students must report in person to the DSA Office at the date and time specified.',
        icon: ShieldAlert,
    },
    {
        id: 'faq-cert-missing',
        category: 'evaluations',
        categoryLabel: 'Evaluations & Certificates',
        question: 'Why is my Certificate of Participation not available for download?',
        answer: 'Certificates are unlocked only after two conditions are met: (1) You have recorded both Check-In and Check-Out attendance for the event, and (2) You have submitted the required Post-Event Evaluation Survey.',
        icon: Award,
    },
    {
        id: 'faq-lost-found',
        category: 'discipline',
        categoryLabel: 'Discipline & Violations',
        question: 'How do I claim or report Lost and Found items on campus?',
        answer: 'The Office of Student Affairs manages the campus Lost and Found repository. Students can report lost belongings through the portal or visit the DSA office with student identification and proof of ownership to claim registered found items.',
        icon: FileQuestion,
    },
    {
        id: 'faq-password-reset',
        category: 'account',
        categoryLabel: 'Account & Login',
        question: 'How do I reset my password if I cannot log in?',
        answer: 'Click the "Forgot Password?" link on the Sign In page. Enter your registered student or institutional email address. You will receive an encrypted reset link valid for 60 minutes to establish a new password.',
        icon: Lock,
    },
    {
        id: 'faq-student-id-login',
        category: 'account',
        categoryLabel: 'Account & Login',
        question: 'Can I log in with my Student ID Number instead of Email?',
        answer: 'Yes! The DSAMS Unified Login system supports authentication using either your official Student ID Number (e.g., 2024-00123) or your registered school email address alongside your secure password.',
        icon: UserCheck,
    },
];

export default function LandingHelp() {
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('all');
    const [expandedGuides, setExpandedGuides] = useState<Record<string, boolean>>({
        'guide-qr-attendance': true,
        'guide-admission-slip': true,
    });
    const [openFaqIndex, setOpenFaqIndex] = useState<string | null>('faq-admission-slip-req');

    const toggleGuide = (id: string) => {
        setExpandedGuides((prev) => ({ ...prev, [id]: !prev[id] }));
    };

    const toggleFaq = (id: string) => {
        setOpenFaqIndex(openFaqIndex === id ? null : id);
    };

    // Filtered guides based on search and category
    const filteredGuides = useMemo(() => {
        return GUIDES.filter((guide) => {
            const matchesCategory = selectedCategory === 'all' || guide.category === selectedCategory;
            const query = searchQuery.toLowerCase().trim();
            if (!query) return matchesCategory;

            const matchesSearch =
                guide.title.toLowerCase().includes(query) ||
                guide.summary.toLowerCase().includes(query) ||
                guide.categoryLabel.toLowerCase().includes(query) ||
                guide.steps.some(
                    (s) => s.title.toLowerCase().includes(query) || s.desc.toLowerCase().includes(query),
                );

            return matchesCategory && matchesSearch;
        });
    }, [searchQuery, selectedCategory]);

    // Filtered FAQs based on search and category
    const filteredFaqs = useMemo(() => {
        return FAQS.filter((faq) => {
            const matchesCategory = selectedCategory === 'all' || faq.category === selectedCategory;
            const query = searchQuery.toLowerCase().trim();
            if (!query) return matchesCategory;

            return (
                matchesCategory &&
                (faq.question.toLowerCase().includes(query) ||
                    faq.answer.toLowerCase().includes(query) ||
                    faq.categoryLabel.toLowerCase().includes(query))
            );
        });
    }, [searchQuery, selectedCategory]);

    return (
        <div className="w-full bg-[#FAFAFA] text-slate-900 selection:bg-blue-600 selection:text-white">
            {/* ─── Hero Header Section ────────────────────────────────────────── */}
            <section className="relative overflow-hidden bg-gradient-to-b from-[#000D6A] via-[#0B2D66] to-[#12397B] pt-24 pb-8 sm:pt-28 sm:pb-10 md:pt-32 md:pb-12 text-white">
                {/* Background ambient lighting and grid */}
                <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff0a_1px,transparent_1px),linear-gradient(to_bottom,#ffffff0a_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none" />
                <div className="absolute top-0 right-1/4 h-64 w-64 rounded-full bg-blue-500/15 blur-[80px] pointer-events-none" />
                <div className="absolute bottom-0 left-1/4 h-52 w-52 rounded-full bg-indigo-500/15 blur-[60px] pointer-events-none" />

                <div className="relative z-10 mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 text-center">
                    {/* Navigation Bar Row */}
                    <div className="flex items-center justify-center gap-2 mb-3">
                        <Link
                            href="/"
                            className="inline-flex items-center gap-1.5 rounded-lg border border-white/20 bg-white/10 px-2.5 py-1 text-xs font-semibold text-white backdrop-blur-md hover:bg-white/20 active:scale-95 transition-all shadow-sm"
                        >
                            <ArrowLeft className="h-3.5 w-3.5" />
                            Back to Home
                        </Link>
                        <div className="inline-flex items-center gap-1 rounded-full border border-blue-400/30 bg-white/10 px-2.5 py-1 text-[11px] font-semibold tracking-wider text-blue-200 uppercase backdrop-blur-md shadow-sm">
                            <LifeBuoy className="h-3 w-3 text-blue-300 animate-pulse" />
                            Help & Docs Center
                        </div>
                    </div>

                    {/* Title */}
                    <h1 className="text-xl sm:text-2xl md:text-3xl font-bold tracking-tight text-white mb-2">
                        How can we help you?
                    </h1>

                    <p className="mx-auto max-w-lg text-xs sm:text-sm text-blue-100/90 leading-relaxed font-normal mb-4">
                        Search guides for student clearances, QR event check-in, GPS geofencing, discipline policies, and certificates.
                    </p>

                    {/* Search Bar */}
                    <div className="mx-auto max-w-lg">
                        <div className="relative flex items-center rounded-xl bg-white/95 p-1 shadow-lg ring-1 ring-black/10 backdrop-blur-md focus-within:ring-2 focus-within:ring-blue-400 transition-all">
                            <div className="flex h-8 w-8 shrink-0 items-center justify-center text-slate-400 pl-1">
                                <Search className="h-4 w-4" />
                            </div>
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder="Search guides, policies, or questions..."
                                className="w-full bg-transparent px-2.5 py-1 text-xs sm:text-sm text-slate-800 placeholder-slate-400 focus:outline-none"
                            />
                            {searchQuery && (
                                <button
                                    onClick={() => setSearchQuery('')}
                                    className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors mr-1"
                                >
                                    <X className="h-3.5 w-3.5" />
                                </button>
                            )}
                        </div>

                        {/* Search feedback */}
                        {searchQuery && (
                            <div className="mt-2 flex items-center justify-center gap-2 text-xs text-blue-200 font-medium">
                                <span>
                                    Found <strong>{filteredGuides.length}</strong> guide(s) and <strong>{filteredFaqs.length}</strong> FAQ(s) matching "{searchQuery}"
                                </span>
                            </div>
                        )}
                    </div>
                </div>
            </section>

            {/* ─── Category Navigation Bar ────────────────────────────────────── */}
            <div className="sticky top-16 z-30 border-b border-slate-200/80 bg-white/95 shadow-xs backdrop-blur-md">
                <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                    <div className="flex items-center gap-2 overflow-x-auto py-3.5 scrollbar-none">
                        {CATEGORIES.map((category) => {
                            const Icon = category.icon;
                            const isActive = selectedCategory === category.id;
                            return (
                                <button
                                    key={category.id}
                                    onClick={() => setSelectedCategory(category.id)}
                                    className={`inline-flex shrink-0 items-center gap-2 rounded-xl px-4 py-2 text-xs sm:text-sm font-bold transition-all duration-200 ${
                                        isActive
                                            ? 'bg-[#000D6A] text-white shadow-md shadow-blue-900/15 ring-1 ring-blue-900/20'
                                            : 'bg-slate-100/80 text-slate-600 hover:bg-slate-200/80 hover:text-slate-900'
                                    }`}
                                >
                                    <Icon className={`h-4 w-4 ${isActive ? 'text-blue-300' : 'text-slate-500'}`} />
                                    {category.label}
                                </button>
                            );
                        })}
                    </div>
                </div>
            </div>

            {/* ─── Main Content Container ─────────────────────────────────────── */}
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12 sm:py-16 space-y-16 sm:space-y-20">
                {/* ── Quick Overview Cards ────────────────────────────────────────── */}
                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
                    <div className="group rounded-3xl border border-slate-200/70 bg-white p-6 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-blue-300 hover:shadow-xl hover:shadow-blue-900/5">
                        <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50 text-[#000D6A] group-hover:bg-[#000D6A] group-hover:text-white transition-colors duration-300">
                            <QrCode className="h-6 w-6" />
                        </div>
                        <h3 className="text-base font-bold text-slate-900 mb-1.5">Smart QR & GPS Check-In</h3>
                        <p className="text-xs sm:text-sm text-slate-500 leading-relaxed">
                            Dynamic 30s rotating tokens and campus GPS boundary enforcement for tamper-proof attendance.
                        </p>
                    </div>

                    <div className="group rounded-3xl border border-slate-200/70 bg-white p-6 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-blue-300 hover:shadow-xl hover:shadow-blue-900/5">
                        <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-50 text-[#23509A] group-hover:bg-[#23509A] group-hover:text-white transition-colors duration-300">
                            <ClipboardCheck className="h-6 w-6" />
                        </div>
                        <h3 className="text-base font-bold text-slate-900 mb-1.5">Digital Admission Slips</h3>
                        <p className="text-xs sm:text-sm text-slate-500 leading-relaxed">
                            Fast online clearance application for absences with medical attachment uploads and QR verification.
                        </p>
                    </div>

                    <div className="group rounded-3xl border border-slate-200/70 bg-white p-6 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-blue-300 hover:shadow-xl hover:shadow-blue-900/5">
                        <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-50 text-amber-600 group-hover:bg-amber-600 group-hover:text-white transition-colors duration-300">
                            <ShieldAlert className="h-6 w-6" />
                        </div>
                        <h3 className="text-base font-bold text-slate-900 mb-1.5">Discipline & Sanctions</h3>
                        <p className="text-xs sm:text-sm text-slate-500 leading-relaxed">
                            Transparent tracking of incident reports, official calling summons, and community service hours.
                        </p>
                    </div>

                    <div className="group rounded-3xl border border-slate-200/70 bg-white p-6 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-blue-300 hover:shadow-xl hover:shadow-blue-900/5">
                        <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600 group-hover:bg-emerald-600 group-hover:text-white transition-colors duration-300">
                            <Award className="h-6 w-6" />
                        </div>
                        <h3 className="text-base font-bold text-slate-900 mb-1.5">Evaluations & Certificates</h3>
                        <p className="text-xs sm:text-sm text-slate-500 leading-relaxed">
                            Complete post-event evaluation surveys to instantly generate authenticated PDF participation certificates.
                        </p>
                    </div>
                </div>

                {/* ── Detailed Step-by-Step Guides Section ────────────────────────── */}
                <section id="guides" className="space-y-8">
                    <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-slate-200 pb-5">
                        <div>
                            <span className="text-xs font-bold tracking-widest text-[#23509A] uppercase">
                                Step-by-Step Walkthroughs
                            </span>
                            <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight mt-1">
                                Interactive System Guides ({filteredGuides.length})
                            </h2>
                        </div>
                        <p className="text-xs sm:text-sm text-slate-500 max-w-md">
                            Click on any guide card to view detailed step-by-step instructions and best practices.
                        </p>
                    </div>

                    {filteredGuides.length === 0 ? (
                        <div className="rounded-3xl border border-dashed border-slate-300 bg-white p-12 text-center">
                            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-slate-400 mb-4">
                                <Search className="h-7 w-7" />
                            </div>
                            <h3 className="text-lg font-bold text-slate-800 mb-1">No guides match your search</h3>
                            <p className="text-sm text-slate-500 mb-6">
                                Try searching with different keywords or switch category filter to "All Guides & Topics".
                            </p>
                            <button
                                onClick={() => {
                                    setSearchQuery('');
                                    setSelectedCategory('all');
                                }}
                                className="inline-flex items-center gap-2 rounded-xl bg-[#000D6A] px-5 py-2.5 text-xs sm:text-sm font-bold text-white shadow-sm hover:bg-blue-900 transition-colors"
                            >
                                Reset All Filters
                            </button>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 gap-6">
                            {filteredGuides.map((guide) => {
                                const Icon = guide.icon;
                                const isExpanded = !!expandedGuides[guide.id];
                                return (
                                    <div
                                        key={guide.id}
                                        className="overflow-hidden rounded-3xl border border-slate-200/80 bg-white shadow-xs transition-all duration-300 hover:border-slate-300 hover:shadow-md"
                                    >
                                        {/* Card Header */}
                                        <div
                                            onClick={() => toggleGuide(guide.id)}
                                            className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 sm:p-7 cursor-pointer select-none bg-white hover:bg-slate-50/50 transition-colors"
                                        >
                                            <div className="flex items-start sm:items-center gap-4">
                                                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-blue-50 text-[#000D6A] ring-1 ring-blue-100">
                                                    <Icon className="h-6 w-6" />
                                                </div>
                                                <div>
                                                    <div className="flex flex-wrap items-center gap-2 mb-1.5">
                                                        <span className="inline-block rounded-md bg-blue-100/70 px-2.5 py-0.5 text-[11px] font-bold text-[#23509A] uppercase tracking-wider">
                                                            {guide.categoryLabel}
                                                        </span>
                                                        <span className="inline-block rounded-md bg-slate-100 px-2.5 py-0.5 text-[11px] font-semibold text-slate-600">
                                                            {guide.badge}
                                                        </span>
                                                    </div>
                                                    <h3 className="text-lg sm:text-xl font-bold text-slate-900 tracking-tight">
                                                        {guide.title}
                                                    </h3>
                                                    <p className="text-xs sm:text-sm text-slate-500 mt-1 leading-relaxed">
                                                        {guide.summary}
                                                    </p>
                                                </div>
                                            </div>

                                            <div className="flex items-center gap-3 shrink-0 self-end sm:self-center">
                                                <span className="text-xs font-bold text-[#23509A] hidden md:inline">
                                                    {isExpanded ? 'Hide Steps' : 'View Steps'}
                                                </span>
                                                <div className={`flex h-9 w-9 items-center justify-center rounded-xl bg-slate-100 text-slate-600 transition-transform duration-300 ${isExpanded ? 'rotate-180 bg-blue-50 text-[#000D6A]' : ''}`}>
                                                    <ChevronDown className="h-5 w-5" />
                                                </div>
                                            </div>
                                        </div>

                                        {/* Expanded Step-by-Step Content */}
                                        {isExpanded && (
                                            <div className="border-t border-slate-100 bg-slate-50/40 p-6 sm:p-8 space-y-6">
                                                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                                                    Step-by-step instructions
                                                </h4>

                                                <div className="space-y-4">
                                                    {guide.steps.map((step, idx) => (
                                                        <div
                                                            key={idx}
                                                            className="flex items-start gap-4 rounded-2xl border border-slate-200/60 bg-white p-4 sm:p-5 shadow-2xs"
                                                        >
                                                            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-[#000D6A] text-xs font-black text-white shadow-xs">
                                                                {idx + 1}
                                                            </div>
                                                            <div className="space-y-1">
                                                                <h5 className="text-sm sm:text-base font-bold text-slate-900">
                                                                    {step.title}
                                                                </h5>
                                                                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                                                                    {step.desc}
                                                                </p>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>

                                                {/* Pro Tip Box */}
                                                {guide.proTip && (
                                                    <div className="flex items-start gap-3.5 rounded-2xl border border-blue-200/70 bg-blue-50/70 p-4 sm:p-5 text-slate-700">
                                                        <Sparkles className="h-5 w-5 shrink-0 text-[#23509A] mt-0.5" />
                                                        <div className="text-xs sm:text-sm leading-relaxed">
                                                            <strong className="font-bold text-[#000D6A]">Pro Tip: </strong>
                                                            {guide.proTip}
                                                        </div>
                                                    </div>
                                                )}

                                                {/* Action Link Button */}
                                                {guide.actionLink && (
                                                    <div className="pt-2 flex justify-end">
                                                        <Link
                                                            href={guide.actionLink}
                                                            className="inline-flex items-center gap-2 rounded-xl bg-[#000D6A] px-5 py-2.5 text-xs sm:text-sm font-bold text-white shadow-sm hover:bg-[#0B2D66] transition-all hover:translate-x-0.5"
                                                        >
                                                            {guide.actionText || 'Open in Portal'}
                                                            <ArrowRight className="h-4 w-4" />
                                                        </Link>
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </section>

                {/* ── Comprehensive FAQs Section ──────────────────────────────────── */}
                <section id="faq" className="space-y-8">
                    <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-slate-200 pb-5">
                        <div>
                            <span className="text-xs font-bold tracking-widest text-[#23509A] uppercase">
                                Questions & Solutions
                            </span>
                            <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight mt-1">
                                Frequently Asked Questions ({filteredFaqs.length})
                            </h2>
                        </div>
                        <p className="text-xs sm:text-sm text-slate-500 max-w-md">
                            Clear answers to the most common questions regarding student policies, attendance, and clearances.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 gap-4">
                        {filteredFaqs.map((faq) => {
                            const Icon = faq.icon;
                            const isOpen = openFaqIndex === faq.id;
                            return (
                                <div
                                    key={faq.id}
                                    className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-2xs transition-all hover:border-slate-300"
                                >
                                    <button
                                        onClick={() => toggleFaq(faq.id)}
                                        className="flex w-full items-center justify-between gap-4 p-5 sm:p-6 text-left hover:bg-slate-50/60 transition-colors"
                                    >
                                        <div className="flex items-center gap-4">
                                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-[#000D6A]">
                                                <Icon className="h-5 w-5" />
                                            </div>
                                            <div>
                                                <span className="inline-block text-[10px] font-bold text-blue-600 uppercase tracking-wider mb-0.5">
                                                    {faq.categoryLabel}
                                                </span>
                                                <h3 className="text-sm sm:text-base font-bold text-slate-900">
                                                    {faq.question}
                                                </h3>
                                            </div>
                                        </div>
                                        <ChevronDown
                                            className={`h-5 w-5 shrink-0 text-slate-400 transition-transform duration-200 ${
                                                isOpen ? 'rotate-180 text-[#000D6A]' : ''
                                            }`}
                                        />
                                    </button>

                                    {isOpen && (
                                        <div className="border-t border-slate-100 bg-slate-50/50 px-6 pt-2 pb-6 sm:pl-20 text-xs sm:text-sm leading-relaxed text-slate-600">
                                            <p>{faq.answer}</p>
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </section>

                {/* ── Campus Policy & Handbook Summary ────────────────────────────── */}
                <section className="rounded-3xl border border-slate-200/80 bg-gradient-to-br from-white via-slate-50 to-blue-50/30 p-8 sm:p-10 shadow-xs space-y-6">
                    <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#000D6A] text-white">
                            <BookOpen className="h-5 w-5" />
                        </div>
                        <div>
                            <span className="text-xs font-bold text-blue-700 uppercase tracking-wider">Campus Regulations</span>
                            <h3 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                                Student Handbook & General Attendance Policy
                            </h3>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-2">
                        <div className="rounded-2xl border border-slate-200/60 bg-white p-5 shadow-2xs space-y-2">
                            <div className="flex items-center gap-2 text-[#000D6A] font-bold text-sm">
                                <Clock className="h-4 w-4" />
                                <span>Attendance & Tardiness</span>
                            </div>
                            <p className="text-xs text-slate-600 leading-relaxed">
                                Students with more than 3 unexcused absences in a term will be referred to the DSA. Tardy entries beyond 15 minutes of class start require clearance.
                            </p>
                        </div>

                        <div className="rounded-2xl border border-slate-200/60 bg-white p-5 shadow-2xs space-y-2">
                            <div className="flex items-center gap-2 text-[#000D6A] font-bold text-sm">
                                <ShieldCheck className="h-4 w-4" />
                                <span>ID & Uniform Compliance</span>
                            </div>
                            <p className="text-xs text-slate-600 leading-relaxed">
                                Validated School ID badges must be worn conspicuously on campus at all times. Temporary gate passes are logged and audited electronically.
                            </p>
                        </div>

                        <div className="rounded-2xl border border-slate-200/60 bg-white p-5 shadow-2xs space-y-2">
                            <div className="flex items-center gap-2 text-[#000D6A] font-bold text-sm">
                                <FileCheck className="h-4 w-4" />
                                <span>Clearance Deadlines</span>
                            </div>
                            <p className="text-xs text-slate-600 leading-relaxed">
                                Admission slip clearance applications must be submitted within 48 hours of return to school to receive excused status.
                            </p>
                        </div>
                    </div>
                </section>

                {/* ── Contact Office of Student Affairs (DSA) ────────────────────── */}
                <section className="rounded-3xl border border-blue-200/80 bg-gradient-to-r from-[#000D6A] via-[#0B2D66] to-[#12397B] p-8 sm:p-12 text-white shadow-xl">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
                        <div className="space-y-4">
                            <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3.5 py-1 text-xs font-semibold text-blue-200 uppercase tracking-wider">
                                <Building className="h-3.5 w-3.5" />
                                Office of Student Affairs (DSA)
                            </div>
                            <h3 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
                                Need direct assistance or have specific inquiries?
                            </h3>
                            <p className="text-xs sm:text-sm text-blue-100/90 leading-relaxed">
                                Our staff and student welfare officers are available during institutional office hours to assist you with clearance processing, incident counseling, and system support.
                            </p>

                            <div className="pt-2 flex flex-wrap gap-3">
                                <Link
                                    href="/login"
                                    className="inline-flex items-center gap-2 rounded-xl bg-white px-5 py-3 text-xs sm:text-sm font-bold text-[#000D6A] shadow-md hover:bg-blue-50 transition-colors"
                                >
                                    <Lock className="h-4 w-4" />
                                    Access Student Portal
                                </Link>
                                <a
                                    href="mailto:dsa@srcb.edu.ph"
                                    className="inline-flex items-center gap-2 rounded-xl border border-white/20 bg-white/10 px-5 py-3 text-xs sm:text-sm font-bold text-white hover:bg-white/20 transition-colors"
                                >
                                    <Mail className="h-4 w-4" />
                                    Email Support
                                </a>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="rounded-2xl bg-white/10 p-5 backdrop-blur-sm border border-white/10 space-y-2">
                                <div className="flex items-center gap-2 text-blue-300 font-bold text-sm">
                                    <MapPin className="h-4 w-4" />
                                    <span>Office Location</span>
                                </div>
                                <p className="text-xs text-blue-100">
                                    Ground Floor, Student Affairs Building, SRCB Main Campus
                                </p>
                            </div>

                            <div className="rounded-2xl bg-white/10 p-5 backdrop-blur-sm border border-white/10 space-y-2">
                                <div className="flex items-center gap-2 text-blue-300 font-bold text-sm">
                                    <Clock className="h-4 w-4" />
                                    <span>Office Hours</span>
                                </div>
                                <p className="text-xs text-blue-100">
                                    Monday to Friday<br />8:00 AM – 5:00 PM (PST)
                                </p>
                            </div>

                            <div className="rounded-2xl bg-white/10 p-5 backdrop-blur-sm border border-white/10 space-y-2">
                                <div className="flex items-center gap-2 text-blue-300 font-bold text-sm">
                                    <Mail className="h-4 w-4" />
                                    <span>Official Email</span>
                                </div>
                                <p className="text-xs text-blue-100">
                                    dsa@srcb.edu.ph<br />support@srcbitsys.io
                                </p>
                            </div>

                            <div className="rounded-2xl bg-white/10 p-5 backdrop-blur-sm border border-white/10 space-y-2">
                                <div className="flex items-center gap-2 text-blue-300 font-bold text-sm">
                                    <Phone className="h-4 w-4" />
                                    <span>Hotline & Incident</span>
                                </div>
                                <p className="text-xs text-blue-100">
                                    Campus Trunkline: (088) 123-4567<br />DSA Local Ext: 104
                                </p>
                            </div>
                        </div>
                    </div>
                </section>
            </div>
        </div>
    );
}
