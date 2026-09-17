import { studentDashboard, studentHelp } from '@/routes';
import type { BreadcrumbItem } from '@/types';
import { Head, Link } from '@inertiajs/react';
import {
    ArrowLeft,
    ArrowRight,
    Award,
    BookOpen,
    Building,
    CheckCircle2,
    ChevronDown,
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
import StudentLayout from '../components/StudentLayout';

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Dashboard', href: studentDashboard() },
    { title: 'Help & Documentation Center', href: studentHelp() },
];

interface StudentGuideItem {
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

interface StudentFaqItem {
    id: string;
    category: string;
    categoryLabel: string;
    question: string;
    answer: string;
    icon: any;
}

const CATEGORIES = [
    { id: 'all', label: 'All Student Guides', icon: Layers },
    { id: 'attendance', label: 'QR Attendance & GPS', icon: QrCode },
    { id: 'admission', label: 'Admission Slips', icon: ClipboardList },
    { id: 'discipline', label: 'Discipline & Violations', icon: ShieldAlert },
    { id: 'evaluations', label: 'Evaluations & Certificates', icon: Award },
    { id: 'app', label: 'PWA Mobile App', icon: Smartphone },
    { id: 'account', label: 'Account & Login', icon: Lock },
];

const STUDENT_GUIDES: StudentGuideItem[] = [
    {
        id: 'guide-qr-attendance',
        title: 'Scanning Event Attendance via Dynamic QR',
        category: 'attendance',
        categoryLabel: 'QR Attendance & GPS',
        badge: 'Attendance Core',
        summary: 'How to scan rotating projector QR codes or present your personal student barcode during school activities.',
        icon: QrCode,
        steps: [
            {
                title: 'Open your Student Dashboard',
                desc: 'Log in to your account from any smartphone or tablet browser and go to your Student Dashboard.',
            },
            {
                title: 'Launch the Camera Scanner',
                desc: 'Tap the "Scan Attendance" button on the active event card or navigate to the scanning portal.',
            },
            {
                title: 'Scan the Live Rotating QR on the Screen',
                desc: 'Point your camera at the projected screen QR code at the venue. The code rotates every 30 seconds to prevent shared screenshots.',
            },
            {
                title: 'Verify Instant Success Audio & Badge',
                desc: 'You will hear a chime and see an instant popup confirming your check-in timestamp and status (On-Time or Late).',
            },
            {
                title: 'Log Time-Out (Check-Out) at Event End',
                desc: 'Before leaving the venue, repeat the scan to record your Time-Out. Both Time-In and Time-Out are required for clearance.',
            },
        ],
        proTip: 'Ensure your mobile browser has camera and location permissions enabled for instant scan decoding.',
        actionLink: '/student/dashboard',
        actionText: 'Go to Dashboard',
    },
    {
        id: 'guide-geofence-checkin',
        title: 'Checking In with Campus GPS Geofencing',
        category: 'attendance',
        categoryLabel: 'QR Attendance & GPS',
        badge: 'Location-Based',
        summary: 'How to check into large assemblies using your smartphone native GPS location when inside venue perimeters.',
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
                desc: 'When prompted by your browser, tap "Allow While Using App" so your device GPS coordinates can be verified.',
            },
            {
                title: 'Automated Distance Calculation',
                desc: 'The system computes your distance from the venue using the high-precision Haversine formula and confirms check-in if within range.',
            },
        ],
        proTip: 'If accuracy is low (>150m), step into an open area away from thick concrete walls for an immediate satellite lock.',
        actionLink: '/student/dashboard',
        actionText: 'View Active Events',
    },
    {
        id: 'guide-admission-slip',
        title: 'Requesting an Admission Slip (Class Re-entry Clearance)',
        category: 'admission',
        categoryLabel: 'Admission Slips',
        badge: 'Absence Clearance',
        summary: 'Official procedure for students returning from absences or tardiness to obtain an authenticated re-entry slip.',
        icon: ClipboardList,
        steps: [
            {
                title: 'Go to Admission Slips',
                desc: 'Select "Admission Slips" from your navigation menu or dashboard shortcut.',
            },
            {
                title: 'Click "Request Admission Slip"',
                desc: 'Complete the clearance form including dates of absence, missed subjects, and specific reason (Medical, Emergency, Official School Activity, Personal).',
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
                title: 'Present Digital or Printed Slip to Teachers',
                desc: 'Open your approved slip with its verifiable security QR code on your phone to present to your subject instructors for class admission.',
            },
        ],
        proTip: 'Submit your request within 48 hours of returning to classes to avoid unexcused absence penalties according to handbook policy.',
        actionLink: '/student/admission-slips',
        actionText: 'My Admission Slips',
    },
    {
        id: 'guide-violations-discipline',
        title: 'Understanding Discipline Notices, Calling Slips & Sanctions',
        category: 'discipline',
        categoryLabel: 'Discipline & Violations',
        badge: 'Student Conduct',
        summary: 'How incident reports, official summons, and corrective community service hours are tracked and resolved.',
        icon: ShieldAlert,
        steps: [
            {
                title: 'Viewing Incident Notices',
                desc: 'When an incident or handbook violation is logged, it appears under your "Violations & Discipline" tab.',
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
                title: 'Receiving Final Clearance',
                desc: 'Upon full completion of required corrective hours, the DSA officer marks the case as "Resolved", clearing your record.',
            },
        ],
        proTip: 'Unresolved disciplinary cases may place a temporary hold on final semester clearance and graduation certificate generation.',
        actionLink: '/student/violations',
        actionText: 'View Discipline Records',
    },
    {
        id: 'guide-evaluations-certificates',
        title: 'Completing Event Evaluations & Downloading Certificates',
        category: 'evaluations',
        categoryLabel: 'Evaluations & Certificates',
        badge: 'Rewards & Credentials',
        summary: 'How to provide feedback on attended institutional activities and automatically unlock your official Certificate of Participation.',
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
                desc: 'Immediately upon survey submission, the system generates your high-resolution PDF Certificate of Participation with a verifiable QR badge.',
            },
            {
                title: 'Download & Archive',
                desc: 'Save the certificate to your device or access it anytime from your "Certificates" digital portfolio tab.',
            },
        ],
        proTip: 'Completing evaluations is required before you can check into subsequent events on the academic calendar.',
        actionLink: '/student/evaluations',
        actionText: 'Pending Evaluations',
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
                desc: 'Look for the "Install DSAMS App" banner at the top of your dashboard, or tap the browser menu (⋮) and select "Install App" or "Add to Home screen".',
            },
            {
                title: 'iOS iPhone & iPad (Safari)',
                desc: 'Open dsa.srcbitsys.io in Safari. Tap the Share button (square with arrow pointing up ↑) at the bottom toolbar, scroll down, and tap "Add to Home Screen" (+).',
            },
            {
                title: 'Launch from Home Screen',
                desc: 'Open the DSAMS icon from your home screen. The app will launch in full-screen standalone mode with no browser URL bar.',
            },
            {
                title: 'Fast Offline Shell & Haptic Touch',
                desc: 'Enjoy instant loading, optimized mobile navigation bar, and instant camera access for attendance scanning.',
            },
        ],
        proTip: 'Installing the app keeps you logged in securely and ensures immediate access during high-traffic event check-in queues.',
        actionLink: '/student/dashboard',
        actionText: 'Open Student App',
    },
    {
        id: 'guide-account-security',
        title: 'Account Access, Student ID Login & Password Recovery',
        category: 'account',
        categoryLabel: 'Account & Login',
        badge: 'Security',
        summary: 'How to manage your credentials, log in with your Student ID number, and reset forgotten passwords.',
        icon: Lock,
        steps: [
            {
                title: 'Student ID Number Login',
                desc: 'You can sign in using either your Student ID Number (e.g. 2024-00123) or your registered school email address.',
            },
            {
                title: 'Forgot Password Reset',
                desc: 'If you forgot your password, click "Forgot Password?" on the login page. Enter your email to receive a password reset link valid for 60 minutes.',
            },
            {
                title: 'Updating Profile Information',
                desc: 'Go to Profile -> Settings to update your emergency contact numbers, home address, and notification preferences.',
            },
            {
                title: 'Pending Account Approval',
                desc: 'Newly registered student accounts require verification by the DSA Admin before full portal access is activated.',
            },
        ],
        proTip: 'Never share your password with anyone. School administrators will never ask for your account password.',
        actionLink: '/student/profile',
        actionText: 'Manage Profile',
    },
];

const STUDENT_FAQS: StudentFaqItem[] = [
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

export default function StudentHelpPage() {
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
        return STUDENT_GUIDES.filter((guide) => {
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
        return STUDENT_FAQS.filter((faq) => {
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
        <StudentLayout breadcrumbs={breadcrumbs}>
            <Head title="Student Help & Documentation Center" />

            <div className="pb-12 text-slate-900 dark:text-white">
                <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-4 py-3 sm:px-6 lg:px-8">
                    {/* ── Header Banner with Search & Back Button ─────────────────────────────── */}
                    <div className="relative overflow-hidden rounded-xl bg-gradient-to-r from-[#000D6A] via-[#0B2D66] to-[#12397B] p-4 sm:p-5 text-white shadow-md">
                        <div className="absolute -right-8 -top-8 h-28 w-28 rounded-full bg-blue-400/10 blur-xl pointer-events-none" />

                        <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                            <div className="space-y-1.5">
                                <div className="flex flex-wrap items-center gap-2">
                                    <Link
                                        href={studentDashboard()}
                                        className="inline-flex items-center gap-1.5 rounded-lg border border-white/20 bg-white/10 px-2.5 py-1 text-xs font-semibold text-white backdrop-blur-md hover:bg-white/20 active:scale-95 transition-all shadow-sm"
                                    >
                                        <ArrowLeft className="h-3.5 w-3.5" />
                                        Back to Dashboard
                                    </Link>
                                    <div className="inline-flex items-center gap-1 rounded-full border border-blue-400/30 bg-white/10 px-2 py-0.5 text-[10px] font-semibold tracking-wide text-blue-200 uppercase backdrop-blur-md">
                                        <LifeBuoy className="h-2.5 w-2.5 text-blue-300 animate-pulse" />
                                        Help & Documentation
                                    </div>
                                </div>

                                <h1 className="text-base sm:text-lg md:text-xl font-bold tracking-tight text-white">
                                    Student Help Center
                                </h1>

                                <p className="text-xs text-blue-100/80 leading-relaxed font-normal max-w-xl">
                                    Guides for QR check-in, GPS geofencing, admission clearance slips, and certificates.
                                </p>
                            </div>

                            {/* Search Input */}
                            <div className="w-full md:w-80 shrink-0">
                                <div className="relative flex items-center rounded-xl bg-white/95 dark:bg-slate-900/95 p-1 shadow-md ring-1 ring-black/10 dark:ring-white/10 backdrop-blur-md focus-within:ring-2 focus-within:ring-blue-400 transition-all">
                                    <div className="flex h-7 w-7 shrink-0 items-center justify-center text-slate-400 pl-1">
                                        <Search className="h-3.5 w-3.5" />
                                    </div>
                                    <input
                                        type="text"
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        placeholder="Search guides or FAQs..."
                                        className="w-full bg-transparent px-2 py-1 text-xs text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:outline-none"
                                    />
                                    {searchQuery && (
                                        <button
                                            onClick={() => setSearchQuery('')}
                                            className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-600 transition-colors mr-1"
                                        >
                                            <X className="h-3 w-3" />
                                        </button>
                                    )}
                                </div>

                                {searchQuery && (
                                    <div className="mt-1.5 text-[10px] text-blue-200 font-medium">
                                        Found <strong>{filteredGuides.length}</strong> guide(s) and <strong>{filteredFaqs.length}</strong> FAQ(s)
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* ── Category Filter Bar ───────────────────────────────────── */}
                    <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none border-b border-slate-200/80 dark:border-slate-800">
                        {CATEGORIES.map((category) => {
                            const Icon = category.icon;
                            const isActive = selectedCategory === category.id;
                            return (
                                <button
                                    key={category.id}
                                    onClick={() => setSelectedCategory(category.id)}
                                    className={`inline-flex shrink-0 items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold transition-all duration-200 ${
                                        isActive
                                            ? 'bg-[#000D6A] text-white shadow-md shadow-blue-900/15 ring-1 ring-blue-900/20 dark:bg-blue-600 dark:text-white'
                                            : 'bg-slate-100/80 text-slate-600 hover:bg-slate-200/80 hover:text-slate-900 dark:bg-slate-800/80 dark:text-slate-200 dark:hover:bg-slate-700 dark:hover:text-white'
                                    }`}
                                >
                                    <Icon className={`h-4 w-4 ${isActive ? 'text-blue-300' : 'text-slate-500 dark:text-slate-300'}`} />
                                    {category.label}
                                </button>
                            );
                        })}
                    </div>

                    {/* ── Quick Feature Cards ───────────────────────────────────── */}
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                        <div className="group rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-xs transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md">
                            <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600 dark:bg-blue-950/60 dark:text-blue-300">
                                <QrCode className="h-5 w-5" />
                            </div>
                            <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-1">Dynamic QR & GPS</h3>
                            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                                Self-scan rotating projector codes and geofence check-ins for instant attendance logs.
                            </p>
                        </div>

                        <div className="group rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-xs transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md">
                            <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 dark:bg-indigo-950/60 dark:text-indigo-300">
                                <ClipboardCheck className="h-5 w-5" />
                            </div>
                            <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-1">Admission Slips</h3>
                            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                                Request class re-entry clearances, attach medical proof, and track DSA officer approval.
                            </p>
                        </div>

                        <div className="group rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-xs transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md">
                            <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-amber-50 text-amber-600 dark:bg-amber-950/60 dark:text-amber-300">
                                <ShieldAlert className="h-5 w-5" />
                            </div>
                            <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-1">Discipline & Sanctions</h3>
                            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                                Check calling slip summons, log community service hours, and obtain final clearance.
                            </p>
                        </div>

                        <div className="group rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-xs transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md">
                            <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-300">
                                <Award className="h-5 w-5" />
                            </div>
                            <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-1">Evaluations & Certificates</h3>
                            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                                Submit seminar evaluation surveys to unlock downloadable high-res PDF participation certificates.
                            </p>
                        </div>
                    </div>

                    {/* ── Interactive Guides Section ────────────────────────────── */}
                    <div className="space-y-6">
                        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-2 border-b border-slate-200 dark:border-slate-800 pb-4">
                            <div>
                                <span className="text-xs font-bold tracking-widest text-blue-600 dark:text-blue-400 uppercase">
                                    Walkthroughs
                                </span>
                                <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight mt-0.5">
                                    Step-by-Step Student Guides ({filteredGuides.length})
                                </h2>
                            </div>
                            <p className="text-xs text-slate-600 dark:text-slate-300">
                                Click any guide to expand the complete walkthrough and pro tips.
                            </p>
                        </div>

                        {filteredGuides.length === 0 ? (
                            <div className="rounded-3xl border border-dashed border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 p-10 text-center">
                                <Search className="mx-auto h-10 w-10 text-slate-400 mb-3" />
                                <h3 className="text-base font-bold text-slate-800 dark:text-slate-200 mb-1">No guides match your search</h3>
                                <p className="text-xs text-slate-600 dark:text-slate-300 mb-4">
                                    Try searching with different keywords or reset category filters.
                                </p>
                                <button
                                    onClick={() => {
                                        setSearchQuery('');
                                        setSelectedCategory('all');
                                    }}
                                    className="inline-flex items-center gap-2 rounded-xl bg-[#000D6A] dark:bg-blue-600 px-4 py-2 text-xs font-bold text-white shadow-sm"
                                >
                                    Reset Filters
                                </button>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 gap-5">
                                {filteredGuides.map((guide) => {
                                    const Icon = guide.icon;
                                    const isExpanded = !!expandedGuides[guide.id];
                                    return (
                                        <div
                                            key={guide.id}
                                            className="overflow-hidden rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs transition-all duration-200 hover:border-slate-300 dark:hover:border-slate-700"
                                        >
                                            {/* Card Header */}
                                            <div
                                                onClick={() => toggleGuide(guide.id)}
                                                className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-5 sm:p-6 cursor-pointer select-none hover:bg-slate-50/50 dark:hover:bg-slate-800/40 transition-colors"
                                            >
                                                <div className="flex items-start sm:items-center gap-4">
                                                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-[#000D6A] dark:bg-blue-950/60 dark:text-blue-300 ring-1 ring-blue-100 dark:ring-blue-900/40">
                                                        <Icon className="h-5 w-5" />
                                                    </div>
                                                    <div>
                                                        <div className="flex flex-wrap items-center gap-2 mb-1">
                                                            <span className="inline-block rounded-md bg-blue-100/70 dark:bg-blue-950/80 px-2.5 py-0.5 text-[10px] font-bold text-[#23509A] dark:text-blue-200 uppercase tracking-wider">
                                                                {guide.categoryLabel}
                                                            </span>
                                                            <span className="inline-block rounded-md bg-slate-100 dark:bg-slate-800 px-2.5 py-0.5 text-[10px] font-semibold text-slate-700 dark:text-slate-200">
                                                                {guide.badge}
                                                            </span>
                                                        </div>
                                                        <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white tracking-tight">
                                                            {guide.title}
                                                        </h3>
                                                        <p className="text-xs text-slate-600 dark:text-slate-300 mt-0.5 leading-relaxed">
                                                            {guide.summary}
                                                        </p>
                                                    </div>
                                                </div>

                                                <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                                                    <span className="text-xs font-bold text-[#23509A] dark:text-blue-300 hidden sm:inline">
                                                        {isExpanded ? 'Hide Steps' : 'View Steps'}
                                                    </span>
                                                    <div className={`flex h-8 w-8 items-center justify-center rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-200 transition-transform duration-200 ${isExpanded ? 'rotate-180 bg-blue-50 text-[#000D6A] dark:bg-blue-950 dark:text-blue-300' : ''}`}>
                                                        <ChevronDown className="h-4 w-4" />
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Expanded Content */}
                                            {isExpanded && (
                                                <div className="border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/40 p-5 sm:p-7 space-y-5">
                                                    <h4 className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-300">
                                                        Step-by-step instructions
                                                    </h4>

                                                    <div className="space-y-3">
                                                        {guide.steps.map((step, idx) => (
                                                            <div
                                                                key={idx}
                                                                className="flex items-start gap-3.5 rounded-xl border border-slate-200/60 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 shadow-2xs"
                                                            >
                                                                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-[#000D6A] dark:bg-blue-600 text-xs font-black text-white shadow-xs">
                                                                    {idx + 1}
                                                                </div>
                                                                <div className="space-y-0.5">
                                                                    <h5 className="text-sm font-bold text-slate-900 dark:text-white">
                                                                        {step.title}
                                                                    </h5>
                                                                    <p className="text-xs text-slate-600 dark:text-slate-200 leading-relaxed">
                                                                        {step.desc}
                                                                    </p>
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>

                                                    {/* Pro Tip Box */}
                                                    {guide.proTip && (
                                                        <div className="flex items-start gap-3 rounded-xl border border-blue-200/70 dark:border-blue-900/60 bg-blue-50/80 dark:bg-blue-950/50 p-4 text-slate-700 dark:text-slate-100">
                                                            <Sparkles className="h-4 w-4 shrink-0 text-blue-600 dark:text-blue-300 mt-0.5" />
                                                            <div className="text-xs leading-relaxed">
                                                                <strong className="font-bold text-[#000D6A] dark:text-blue-200">Pro Tip: </strong>
                                                                {guide.proTip}
                                                            </div>
                                                        </div>
                                                    )}

                                                    {/* Action Link Button */}
                                                    {guide.actionLink && (
                                                        <div className="pt-1 flex justify-end">
                                                            <Link
                                                                href={guide.actionLink}
                                                                className="inline-flex items-center gap-1.5 rounded-xl bg-[#000D6A] dark:bg-blue-600 px-4 py-2 text-xs font-bold text-white shadow-sm hover:bg-[#0B2D66] dark:hover:bg-blue-700 transition-all hover:translate-x-0.5"
                                                            >
                                                                {guide.actionText || 'Open in Portal'}
                                                                <ArrowRight className="h-3.5 w-3.5" />
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
                    </div>

                    {/* ── FAQ Accordion Section ─────────────────────────────────── */}
                    <div className="space-y-6">
                        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-2 border-b border-slate-200 dark:border-slate-800 pb-4">
                            <div>
                                <span className="text-xs font-bold tracking-widest text-blue-600 dark:text-blue-400 uppercase">
                                    Questions & Answers
                                </span>
                                <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight mt-0.5">
                                    Frequently Asked Questions ({filteredFaqs.length})
                                </h2>
                            </div>
                            <p className="text-xs text-slate-600 dark:text-slate-300">
                                Click any question to expand the answer.
                            </p>
                        </div>

                        <div className="grid grid-cols-1 gap-3.5">
                            {filteredFaqs.map((faq) => {
                                const Icon = faq.icon;
                                const isOpen = openFaqIndex === faq.id;
                                return (
                                    <div
                                        key={faq.id}
                                        className="overflow-hidden rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xs transition-all hover:border-slate-300 dark:hover:border-slate-700"
                                    >
                                        <button
                                            onClick={() => toggleFaq(faq.id)}
                                            className="flex w-full items-center justify-between gap-4 p-4 sm:p-5 text-left hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors"
                                        >
                                            <div className="flex items-center gap-3.5">
                                                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-[#000D6A] dark:bg-blue-950/60 dark:text-blue-300">
                                                    <Icon className="h-4 w-4" />
                                                </div>
                                                <div>
                                                    <span className="inline-block text-[10px] font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider mb-0.5">
                                                        {faq.categoryLabel}
                                                    </span>
                                                    <h3 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white">
                                                        {faq.question}
                                                    </h3>
                                                </div>
                                            </div>
                                            <ChevronDown
                                                className={`h-4 w-4 shrink-0 text-slate-400 dark:text-slate-300 transition-transform duration-200 ${
                                                    isOpen ? 'rotate-180 text-blue-600 dark:text-blue-400' : ''
                                                }`}
                                            />
                                        </button>

                                        {isOpen && (
                                            <div className="border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/40 px-5 pt-2 pb-5 sm:pl-16 text-xs leading-relaxed text-slate-700 dark:text-slate-200">
                                                <p>{faq.answer}</p>
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* ── Student Handbook Quick Policy Cards ───────────────────── */}
                    <div className="rounded-3xl border border-slate-200/80 dark:border-slate-800 bg-gradient-to-br from-white via-slate-50 to-blue-50/30 dark:from-slate-900 dark:via-slate-900 dark:to-slate-800 p-6 sm:p-8 shadow-xs space-y-5">
                        <div className="flex items-center gap-3">
                            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#000D6A] dark:bg-blue-600 text-white">
                                <BookOpen className="h-5 w-5" />
                            </div>
                            <div>
                                <span className="text-[10px] font-bold text-blue-700 dark:text-blue-400 uppercase tracking-wider">Campus Regulations</span>
                                <h3 className="text-lg sm:text-xl font-black text-slate-900 dark:text-white tracking-tight">
                                    Student Handbook & General Policies
                                </h3>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-1">
                            <div className="rounded-2xl border border-slate-200/60 dark:border-slate-800 bg-white dark:bg-slate-900/80 p-4 shadow-2xs space-y-1.5">
                                <div className="flex items-center gap-2 text-[#000D6A] dark:text-blue-300 font-bold text-xs">
                                    <Clock className="h-4 w-4" />
                                    <span>Absence & Tardiness</span>
                                </div>
                                <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                                    More than 3 unexcused absences require an approved Admission Slip from DSA. Tardy entries beyond 15 minutes of class start require clearance.
                                </p>
                            </div>

                            <div className="rounded-2xl border border-slate-200/60 dark:border-slate-800 bg-white dark:bg-slate-900/80 p-4 shadow-2xs space-y-1.5">
                                <div className="flex items-center gap-2 text-[#000D6A] dark:text-blue-300 font-bold text-xs">
                                    <ShieldCheck className="h-4 w-4" />
                                    <span>ID & Uniform Compliance</span>
                                </div>
                                <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                                    Validated School ID cards must be worn on campus at all times. Lost ID passes are logged electronically by campus security.
                                </p>
                            </div>

                            <div className="rounded-2xl border border-slate-200/60 dark:border-slate-800 bg-white dark:bg-slate-900/80 p-4 shadow-2xs space-y-1.5">
                                <div className="flex items-center gap-2 text-[#000D6A] dark:text-blue-300 font-bold text-xs">
                                    <FileCheck className="h-4 w-4" />
                                    <span>Clearance Deadlines</span>
                                </div>
                                <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                                    Admission slip applications must be submitted within 48 hours of returning to classes to obtain excused status.
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* ── Office of Student Affairs Contact ─────────────────────── */}
                    <div className="rounded-3xl border border-blue-200/80 dark:border-blue-900/50 bg-gradient-to-r from-[#000D6A] via-[#0B2D66] to-[#12397B] p-6 sm:p-8 text-white shadow-lg">
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-center">
                            <div className="space-y-3">
                                <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-0.5 text-xs font-semibold text-blue-200 uppercase tracking-wider">
                                    <Building className="h-3.5 w-3.5" />
                                    Office of Student Affairs (DSA)
                                </div>
                                <h3 className="text-xl sm:text-2xl font-black tracking-tight text-white">
                                    Need assistance or having technical trouble?
                                </h3>
                                <p className="text-xs text-blue-100/90 leading-relaxed">
                                    Visit the DSA Office during regular campus hours for help with clearance processing, calling slip conferences, and lost items.
                                </p>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                                <div className="rounded-2xl bg-white/10 p-4 backdrop-blur-sm border border-white/10 space-y-1">
                                    <div className="flex items-center gap-1.5 text-blue-300 font-bold">
                                        <MapPin className="h-4 w-4" />
                                        <span>Office Location</span>
                                    </div>
                                    <p className="text-blue-100">
                                        Ground Floor, Student Affairs Building, SRCB Main Campus
                                    </p>
                                </div>

                                <div className="rounded-2xl bg-white/10 p-4 backdrop-blur-sm border border-white/10 space-y-1">
                                    <div className="flex items-center gap-1.5 text-blue-300 font-bold">
                                        <Clock className="h-4 w-4" />
                                        <span>Office Hours</span>
                                    </div>
                                    <p className="text-blue-100">
                                        Monday to Friday: 8:00 AM – 5:00 PM
                                    </p>
                                </div>

                                <div className="rounded-2xl bg-white/10 p-4 backdrop-blur-sm border border-white/10 space-y-1">
                                    <div className="flex items-center gap-1.5 text-blue-300 font-bold">
                                        <Mail className="h-4 w-4" />
                                        <span>Support Email</span>
                                    </div>
                                    <p className="text-blue-100">
                                        dsa@srcb.edu.ph
                                    </p>
                                </div>

                                <div className="rounded-2xl bg-white/10 p-4 backdrop-blur-sm border border-white/10 space-y-1">
                                    <div className="flex items-center gap-1.5 text-blue-300 font-bold">
                                        <Phone className="h-4 w-4" />
                                        <span>Hotline & Incident</span>
                                    </div>
                                    <p className="text-blue-100">
                                        (088) 123-4567 | Ext: 104
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </StudentLayout>
    );
}
