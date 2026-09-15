import LandingFooter from '@/components/landing/landing-footer';
import LandingNavbar from '@/components/landing/landing-navbar';
import type { SharedData } from '@/types';
import { Head, Link, usePage } from '@inertiajs/react';
import {
    Activity,
    Award,
    BookOpen,
    Building2,
    Calendar,
    CheckCircle2,
    ClipboardCheck,
    Compass,
    ExternalLink,
    FileCheck,
    FileSpreadsheet,
    FileText,
    GraduationCap,
    HelpCircle,
    Home,
    Layers,
    Lock,
    LogIn,
    MapPin,
    QrCode,
    Search,
    Shield,
    ShieldAlert,
    Sparkles,
    UserCheck,
    Users,
} from 'lucide-react';
import { useMemo, useState } from 'react';

interface SitemapItem {
    title: string;
    description: string;
    href: string;
    icon: any;
    badge: 'Public' | 'Student' | 'Program Head' | 'Admin / DSA' | 'Policy';
    badgeColor: string;
    isExternal?: boolean;
}

interface SitemapCategory {
    id: string;
    title: string;
    description: string;
    icon: any;
    accentColor: string;
    items: SitemapItem[];
}

export default function SitemapPage() {
    const { auth } = usePage<SharedData>().props;
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedCategory, setSelectedCategory] = useState<string>('all');

    const sitemapCategories: SitemapCategory[] = [
        {
            id: 'public',
            title: 'Public & Information Pages',
            description:
                'General information, campus policies, user registration, and system overview available to all visitors.',
            icon: Compass,
            accentColor: 'from-blue-600 to-indigo-700',
            items: [
                {
                    title: 'Home (Landing Page)',
                    description:
                        'Overview of the Office of the Student Affairs Management System, core highlights, and announcements.',
                    href: '/#home',
                    icon: Home,
                    badge: 'Public',
                    badgeColor:
                        'bg-blue-50 text-blue-700 border-blue-200',
                },
                {
                    title: 'About OSAMS & DSA',
                    description:
                        'Learn about the Office of Student Affairs, leadership, core pillars, and service mission at SRCB.',
                    href: '/about',
                    icon: Building2,
                    badge: 'Public',
                    badgeColor:
                        'bg-blue-50 text-blue-700 border-blue-200',
                },
                {
                    title: 'System Features & Services',
                    description:
                        'Explore all digital services: dynamic QR attendance, digital clearances, discipline tracking, and evaluations.',
                    href: '/features',
                    icon: Sparkles,
                    badge: 'Public',
                    badgeColor:
                        'bg-blue-50 text-blue-700 border-blue-200',
                },
                {
                    title: 'Mission & Vision',
                    description:
                        "Institutional goals, Augustinian values, and vision for student excellence at St. Rita's College of Balingasag.",
                    href: '/#mission',
                    icon: BookOpen,
                    badge: 'Public',
                    badgeColor:
                        'bg-blue-50 text-blue-700 border-blue-200',
                },
                {
                    title: 'Help Center & FAQs',
                    description:
                        'Step-by-step guides, frequently asked questions, clearance requirements, and student manuals.',
                    href: '/help',
                    icon: HelpCircle,
                    badge: 'Public',
                    badgeColor:
                        'bg-blue-50 text-blue-700 border-blue-200',
                },
                {
                    title: 'Unified Portal Sign In',
                    description:
                        'Single sign-in gateway for Students, Program Heads, Faculty, and DSA Administrators.',
                    href: '/login',
                    icon: LogIn,
                    badge: 'Public',
                    badgeColor:
                        'bg-blue-50 text-blue-700 border-blue-200',
                },
                {
                    title: 'Contact & Campus Location',
                    description:
                        'Reach out to the DSA Office, view telephone directories, office email, and interactive campus map.',
                    href: '/#contact',
                    icon: MapPin,
                    badge: 'Public',
                    badgeColor:
                        'bg-blue-50 text-blue-700 border-blue-200',
                },
            ],
        },
        {
            id: 'student',
            title: 'Student Portal Hub',
            description:
                'Self-service portal for enrolled students to manage clearances, scan event attendance, evaluate events, and monitor records.',
            icon: GraduationCap,
            accentColor: 'from-emerald-600 to-teal-700',
            items: [
                {
                    title: 'Student Dashboard',
                    description:
                        'Personal hub with clearance statuses, upcoming institutional events, recent notifications, and quick metrics.',
                    href: '/student-dashboard',
                    icon: Home,
                    badge: 'Student',
                    badgeColor:
                        'bg-emerald-50 text-emerald-700 border-emerald-200',
                },
                {
                    title: 'Admission Slips Clearance',
                    description:
                        'Submit absence or tardiness clearance requests, attach doctor notes or excuse letters, and download approved digital slips.',
                    href: '/student/admission-slip',
                    icon: FileCheck,
                    badge: 'Student',
                    badgeColor:
                        'bg-emerald-50 text-emerald-700 border-emerald-200',
                },
                {
                    title: 'Dynamic QR Event Attendance',
                    description:
                        'Check in to ongoing campus events and seminars using live dynamic QR code scanning and geofencing verification.',
                    href: '/student-dashboard',
                    icon: QrCode,
                    badge: 'Student',
                    badgeColor:
                        'bg-emerald-50 text-emerald-700 border-emerald-200',
                },
                {
                    title: 'Discipline & Incident Records',
                    description:
                        'Review student handbook incident notifications, hearing schedules, calling notices, and community service progress.',
                    href: '/student-dashboard',
                    icon: ShieldAlert,
                    badge: 'Student',
                    badgeColor:
                        'bg-emerald-50 text-emerald-700 border-emerald-200',
                },
                {
                    title: 'Event Evaluation Surveys',
                    description:
                        'Answer institutional feedback surveys for attended campus activities to unlock certificate generation.',
                    href: '/student-dashboard',
                    icon: ClipboardCheck,
                    badge: 'Student',
                    badgeColor:
                        'bg-emerald-50 text-emerald-700 border-emerald-200',
                },
                {
                    title: 'Certificate of Participation Hub',
                    description:
                        'Access and download official digital certificates of participation for verified event attendances.',
                    href: '/student/certificates',
                    icon: Award,
                    badge: 'Student',
                    badgeColor:
                        'bg-emerald-50 text-emerald-700 border-emerald-200',
                },
                {
                    title: 'Student Help & User Guide',
                    description:
                        'Dedicated student documentation covering clearance submission steps, QR scanning troubleshooting, and password resets.',
                    href: '/student/help',
                    icon: HelpCircle,
                    badge: 'Student',
                    badgeColor:
                        'bg-emerald-50 text-emerald-700 border-emerald-200',
                },
            ],
        },
        {
            id: 'program-head',
            title: 'Program Head Portal',
            description:
                'Departmental management portal for academic program heads to monitor student rosters, attendance compliance, and incident reports.',
            icon: Users,
            accentColor: 'from-amber-600 to-orange-700',
            items: [
                {
                    title: 'Program Head Dashboard',
                    description:
                        'Department-level analytics, active student enrollment counts, attendance percentages, and pending student verifications.',
                    href: '/program-head-dashboard',
                    icon: Home,
                    badge: 'Program Head',
                    badgeColor:
                        'bg-amber-50 text-amber-700 border-amber-200',
                },
                {
                    title: 'Student Roster & Verification',
                    description:
                        'Verify newly registered students in your department, manage year levels, update student statuses, and export student lists.',
                    href: '/program-head/students',
                    icon: UserCheck,
                    badge: 'Program Head',
                    badgeColor:
                        'bg-amber-50 text-amber-700 border-amber-200',
                },
                {
                    title: 'Department Attendance Monitoring',
                    description:
                        'Filter event attendance records by course and section, check time-in/out logs, and print event attendance sheets.',
                    href: '/program-head/attendance',
                    icon: QrCode,
                    badge: 'Program Head',
                    badgeColor:
                        'bg-amber-50 text-amber-700 border-amber-200',
                },
                {
                    title: 'Department Violations & Discipline',
                    description:
                        'Monitor student handbook violations within your department, track calling notices, and coordinate with DSA.',
                    href: '/program-head/violations',
                    icon: ShieldAlert,
                    badge: 'Program Head',
                    badgeColor:
                        'bg-amber-50 text-amber-700 border-amber-200',
                },
                {
                    title: 'Departmental Reports & Export',
                    description:
                        'Generate summary and detailed reports in CSV or print-ready formats for academic compliance audits.',
                    href: '/program-head/reports',
                    icon: FileSpreadsheet,
                    badge: 'Program Head',
                    badgeColor:
                        'bg-amber-50 text-amber-700 border-amber-200',
                },
                {
                    title: 'Calendar of Events',
                    description:
                        'View institutional events, schedule department activities, and submit dates for DSA approval.',
                    href: '/program-head/calendar-events',
                    icon: Calendar,
                    badge: 'Program Head',
                    badgeColor:
                        'bg-amber-50 text-amber-700 border-amber-200',
                },
                {
                    title: 'Activity & Audit Log',
                    description:
                        'Review timestamped audit trails of departmental verifications, status modifications, and report downloads.',
                    href: '/program-head/activity-log',
                    icon: Activity,
                    badge: 'Program Head',
                    badgeColor:
                        'bg-amber-50 text-amber-700 border-amber-200',
                },
            ],
        },
        {
            id: 'admin',
            title: 'Admin & DSA Office Portal',
            description:
                'Full administrative console for the Dean of Student Affairs and system administrators to manage institution-wide operations.',
            icon: Shield,
            accentColor: 'from-blue-700 to-indigo-900',
            items: [
                {
                    title: 'Admin Executive Dashboard',
                    description:
                        'Campus-wide student statistics, daily clearance requests, live attendance feeds, and active violation metrics.',
                    href: '/admin-dashboard',
                    icon: Home,
                    badge: 'Admin / DSA',
                    badgeColor:
                        'bg-indigo-50 text-indigo-700 border-indigo-200',
                },
                {
                    title: 'User & Student Management',
                    description:
                        'Manage student accounts, program heads, bulk CSV student imports, account approvals, and archive records.',
                    href: '/admin/manage-users',
                    icon: Users,
                    badge: 'Admin / DSA',
                    badgeColor:
                        'bg-indigo-50 text-indigo-700 border-indigo-200',
                },
                {
                    title: 'Academic Programs Configuration',
                    description:
                        'Add, edit, and organize degree programs, department codes, majors, and curriculum assignments.',
                    href: '/admin/programs',
                    icon: Layers,
                    badge: 'Admin / DSA',
                    badgeColor:
                        'bg-indigo-50 text-indigo-700 border-indigo-200',
                },
                {
                    title: 'Campus Events & QR Scanner Hub',
                    description:
                        'Create institutional events, configure geofences, launch real-time rotating dynamic QR codes, and assign attendance officers.',
                    href: '/admin/events',
                    icon: Calendar,
                    badge: 'Admin / DSA',
                    badgeColor:
                        'bg-indigo-50 text-indigo-700 border-indigo-200',
                },
                {
                    title: 'Admission Slips (DSA Clearance)',
                    description:
                        'Verify, approve, or reject student re-admission slips, view medical documentation, and generate clearance logs.',
                    href: '/admin/admission-slip',
                    icon: FileCheck,
                    badge: 'Admin / DSA',
                    badgeColor:
                        'bg-indigo-50 text-indigo-700 border-indigo-200',
                },
                {
                    title: 'Incidents & Violations Action Board',
                    description:
                        'Log student handbook infractions, manage progressive calling notice flows, schedule hearings, and issue sanction decisions.',
                    href: '/admin/incidents-violations',
                    icon: ShieldAlert,
                    badge: 'Admin / DSA',
                    badgeColor:
                        'bg-indigo-50 text-indigo-700 border-indigo-200',
                },
                {
                    title: 'Attendance Records & Live Monitoring',
                    description:
                        'Review real-time event check-ins, manual attendance overrides, student search lookup, and export attendance rosters.',
                    href: '/admin/attendance',
                    icon: QrCode,
                    badge: 'Admin / DSA',
                    badgeColor:
                        'bg-indigo-50 text-indigo-700 border-indigo-200',
                },
                {
                    title: 'Event Evaluation Survey Management',
                    description:
                        'Create evaluation forms, analyze Likert rating metrics, view student feedback, and manage certificate triggers.',
                    href: '/admin/evaluation',
                    icon: ClipboardCheck,
                    badge: 'Admin / DSA',
                    badgeColor:
                        'bg-indigo-50 text-indigo-700 border-indigo-200',
                },
                {
                    title: 'Analytics & Printable Reports Hub',
                    description:
                        'Comprehensive data visualizations, multi-filter violation summaries, attendance compliance, and exportable audit documents.',
                    href: '/admin/reports',
                    icon: FileSpreadsheet,
                    badge: 'Admin / DSA',
                    badgeColor:
                        'bg-indigo-50 text-indigo-700 border-indigo-200',
                },
                {
                    title: 'System Activity Logs & Archive',
                    description:
                        'Security audit trails, IP address tracking, login attempts, restore archived records, and system security monitor.',
                    href: '/admin/activity-log',
                    icon: Activity,
                    badge: 'Admin / DSA',
                    badgeColor:
                        'bg-indigo-50 text-indigo-700 border-indigo-200',
                },
            ],
        },
        {
            id: 'policies',
            title: 'Governance & Institutional Policies',
            description:
                'Official legal guidelines, data privacy standards, and campus student handbook regulations governing the OSAMS platform.',
            icon: Lock,
            accentColor: 'from-slate-700 to-slate-900',
            items: [
                {
                    title: 'Data Privacy Policy (RA 10173)',
                    description:
                        'Detailed notice on how student personal data, attendance logs, and medical excuse files are protected and processed.',
                    href: '/help#privacy',
                    icon: Shield,
                    badge: 'Policy',
                    badgeColor:
                        'bg-slate-100 text-slate-700 border-slate-300',
                },
                {
                    title: 'Terms of Service & Code of Conduct',
                    description:
                        'Rules governing authorized access, password confidentiality, integrity of digital clearance submissions, and penalties for forgery.',
                    href: '/help#terms',
                    icon: FileText,
                    badge: 'Policy',
                    badgeColor:
                        'bg-slate-100 text-slate-700 border-slate-300',
                },
                {
                    title: 'Student Handbook Infraction Matrix',
                    description:
                        'Categorized classification of minor, major, and grave student violations with corresponding progressive disciplinary measures.',
                    href: '/help#handbook',
                    icon: BookOpen,
                    badge: 'Policy',
                    badgeColor:
                        'bg-slate-100 text-slate-700 border-slate-300',
                },
            ],
        },
    ];

    // Filter items based on search and category
    const filteredCategories = useMemo(() => {
        return sitemapCategories
            .filter((cat) => {
                if (selectedCategory === 'all') return true;
                return cat.id === selectedCategory;
            })
            .map((cat) => {
                if (!searchQuery.trim()) return cat;

                const q = searchQuery.toLowerCase().trim();
                const matchingItems = cat.items.filter(
                    (item) =>
                        item.title.toLowerCase().includes(q) ||
                        item.description.toLowerCase().includes(q) ||
                        item.badge.toLowerCase().includes(q),
                );

                return {
                    ...cat,
                    items: matchingItems,
                };
            })
            .filter((cat) => cat.items.length > 0);
    }, [searchQuery, selectedCategory]);

    const totalLinks = useMemo(() => {
        return sitemapCategories.reduce(
            (acc, cat) => acc + cat.items.length,
            0,
        );
    }, []);

    return (
        <>
            <Head title="System Sitemap - OSAMS" />
            <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col justify-between">
                <LandingNavbar isAuthed={!!auth?.user} />

                <main className="pt-24 pb-20 flex-grow">
                    {/* Hero Header */}
                    <div className="relative overflow-hidden bg-gradient-to-b from-[#000D6A] via-[#0A1B8C] to-[#23509A] text-white py-16 sm:py-20 mb-12 shadow-lg">
                        <div className="absolute inset-0 opacity-10">
                            <div
                                className="absolute inset-0"
                                style={{
                                    backgroundImage: `radial-gradient(circle at 25% 25%, #8CE4FF 1px, transparent 1px), radial-gradient(circle at 75% 75%, #ffffff 1px, transparent 1px)`,
                                    backgroundSize: '32px 32px',
                                }}
                            />
                        </div>

                        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                            <div className="flex flex-col items-center text-center">
                                <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-1.5 text-xs font-semibold tracking-wider text-[#8CE4FF] uppercase backdrop-blur-sm border border-white/10 mb-4">
                                    <Compass className="h-3.5 w-3.5" />
                                    System Navigation Index
                                </div>
                                <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-white mb-4">
                                    OSAMS Site Map & Directory
                                </h1>
                                <p className="max-w-2xl text-sm sm:text-base text-blue-100/90 leading-relaxed mb-8">
                                    Comprehensive structural index of all public
                                    pages, student self-service tools, program head
                                    portals, administrative modules, and institutional
                                    policies for St. Rita's College of Balingasag.
                                </p>

                                {/* Search Bar */}
                                <div className="w-full max-w-xl relative">
                                    <div className="relative flex items-center">
                                        <Search className="absolute left-4 h-5 w-5 text-slate-400 pointer-events-none" />
                                        <input
                                            type="text"
                                            value={searchQuery}
                                            onChange={(e) =>
                                                setSearchQuery(e.target.value)
                                            }
                                            placeholder="Search any page, portal, module, or policy (e.g. clearance, attendance, reports)..."
                                            className="w-full rounded-2xl bg-white text-slate-900 placeholder:text-slate-400 pl-11 pr-10 py-3.5 text-sm shadow-xl focus:outline-none focus:ring-4 focus:ring-[#8CE4FF]/40 border-0"
                                        />
                                        {searchQuery && (
                                            <button
                                                onClick={() =>
                                                    setSearchQuery('')
                                                }
                                                className="absolute right-3.5 text-xs font-semibold text-slate-400 hover:text-slate-700 bg-slate-100 rounded-full px-2 py-1"
                                            >
                                                Clear
                                            </button>
                                        )}
                                    </div>
                                </div>

                                {/* Category Filter Pills */}
                                <div className="flex flex-wrap items-center justify-center gap-2 mt-6">
                                    <button
                                        onClick={() => setSelectedCategory('all')}
                                        className={`rounded-xl px-3.5 py-1.5 text-xs font-semibold transition-all ${
                                            selectedCategory === 'all'
                                                ? 'bg-white text-[#000D6A] shadow-md font-bold'
                                                : 'bg-white/10 text-white/90 hover:bg-white/20'
                                        }`}
                                    >
                                        All Sections ({totalLinks})
                                    </button>
                                    {sitemapCategories.map((cat) => (
                                        <button
                                            key={cat.id}
                                            onClick={() =>
                                                setSelectedCategory(cat.id)
                                            }
                                            className={`rounded-xl px-3.5 py-1.5 text-xs font-semibold transition-all flex items-center gap-1.5 ${
                                                selectedCategory === cat.id
                                                    ? 'bg-white text-[#000D6A] shadow-md font-bold'
                                                    : 'bg-white/10 text-white/90 hover:bg-white/20'
                                            }`}
                                        >
                                            <cat.icon className="h-3.5 w-3.5" />
                                            {cat.title.split(' ')[0]} (
                                            {cat.items.length})
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Main Content Area */}
                    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                        {/* Quick Stats Bar */}
                        <div className="mb-10 grid grid-cols-2 gap-4 sm:grid-cols-4">
                            <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm">
                                <div className="text-xs font-medium text-slate-500">
                                    Total Indexed Links
                                </div>
                                <div className="mt-1 text-2xl font-bold text-[#000D6A]">
                                    {totalLinks} Pages & Portals
                                </div>
                            </div>
                            <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm">
                                <div className="text-xs font-medium text-slate-500">
                                    User Access Roles
                                </div>
                                <div className="mt-1 text-2xl font-bold text-blue-600">
                                    4 Gateways
                                </div>
                            </div>
                            <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm">
                                <div className="text-xs font-medium text-slate-500">
                                    Public Services
                                </div>
                                <div className="mt-1 text-2xl font-bold text-emerald-600">
                                    8 Core Features
                                </div>
                            </div>
                            <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm">
                                <div className="text-xs font-medium text-slate-500">
                                    Compliance & Security
                                </div>
                                <div className="mt-1 text-2xl font-bold text-indigo-600">
                                    RA 10173 Ready
                                </div>
                            </div>
                        </div>

                        {/* Search Feedback */}
                        {searchQuery && (
                            <div className="mb-6 flex items-center justify-between rounded-xl bg-blue-50 px-4 py-3 text-sm text-blue-900 border border-blue-200">
                                <div>
                                    Showing search results for "
                                    <span className="font-bold">{searchQuery}</span>
                                    "
                                </div>
                                <button
                                    onClick={() => setSearchQuery('')}
                                    className="font-medium text-blue-700 hover:underline"
                                >
                                    Reset Search
                                </button>
                            </div>
                        )}

                        {filteredCategories.length === 0 ? (
                            <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center shadow-sm">
                                <HelpCircle className="mx-auto h-12 w-12 text-slate-400 mb-3" />
                                <h3 className="text-lg font-bold text-slate-900">
                                    No matching pages found
                                </h3>
                                <p className="text-sm text-slate-500 mt-1 max-w-md mx-auto">
                                    We couldn't find any site section or module matching "
                                    {searchQuery}". Try searching for keywords like "clearance", "attendance", "login", or "reports".
                                </p>
                                <button
                                    onClick={() => {
                                        setSearchQuery('');
                                        setSelectedCategory('all');
                                    }}
                                    className="mt-5 rounded-xl bg-[#23509A] px-5 py-2.5 text-xs font-semibold text-white shadow hover:bg-[#000D6A] transition-all"
                                >
                                    View All Site Sections
                                </button>
                            </div>
                        ) : (
                            <div className="space-y-12">
                                {filteredCategories.map((category) => (
                                    <div
                                        key={category.id}
                                        id={category.id}
                                        className="rounded-3xl border border-slate-200/90 bg-white p-6 sm:p-8 shadow-sm transition-all"
                                    >
                                        {/* Category Header */}
                                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-100">
                                            <div className="flex items-start gap-3.5">
                                                <div
                                                    className={`flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-tr ${category.accentColor} text-white shadow-md shrink-0`}
                                                >
                                                    <category.icon className="h-6 w-6" />
                                                </div>
                                                <div>
                                                    <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900">
                                                        {category.title}
                                                    </h2>
                                                    <p className="text-xs sm:text-sm text-slate-600 mt-0.5">
                                                        {category.description}
                                                    </p>
                                                </div>
                                            </div>

                                            <span className="self-start sm:self-center text-xs font-bold text-slate-500 bg-slate-100 px-3 py-1.5 rounded-full">
                                                {category.items.length}{' '}
                                                {category.items.length === 1
                                                    ? 'Module'
                                                    : 'Modules'}
                                            </span>
                                        </div>

                                        {/* Items Grid */}
                                        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                                            {category.items.map((item, idx) => (
                                                <Link
                                                    key={idx}
                                                    href={item.href}
                                                    className="group flex flex-col justify-between rounded-2xl border border-slate-200/80 bg-slate-50/50 p-5 transition-all duration-200 hover:-translate-y-1 hover:border-[#23509A]/40 hover:bg-white hover:shadow-md"
                                                >
                                                    <div>
                                                        <div className="flex items-center justify-between gap-2 mb-3">
                                                            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white shadow-sm border border-slate-200/70 text-[#23509A] group-hover:bg-[#23509A] group-hover:text-white transition-colors">
                                                                <item.icon className="h-4.5 w-4.5" />
                                                            </div>
                                                            <span
                                                                className={`rounded-lg border px-2.5 py-0.5 text-[11px] font-bold ${item.badgeColor}`}
                                                            >
                                                                {item.badge}
                                                            </span>
                                                        </div>

                                                        <h3 className="text-base font-bold text-slate-900 group-hover:text-[#23509A] transition-colors flex items-center gap-1.5">
                                                            {item.title}
                                                        </h3>

                                                        <p className="mt-1.5 text-xs text-slate-600 leading-relaxed line-clamp-3">
                                                            {item.description}
                                                        </p>
                                                    </div>

                                                    <div className="mt-4 pt-3 border-t border-slate-200/60 flex items-center justify-between text-xs font-semibold text-[#23509A] group-hover:text-[#000D6A]">
                                                        <span>Navigate</span>
                                                        <ExternalLink className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                                                    </div>
                                                </Link>
                                            ))}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}

                        {/* Bottom Support Banner */}
                        <div className="mt-12 rounded-3xl bg-gradient-to-r from-[#000D6A] to-[#23509A] p-8 sm:p-10 text-white shadow-xl flex flex-col md:flex-row items-center justify-between gap-6">
                            <div className="space-y-2 text-center md:text-left">
                                <h3 className="text-xl sm:text-2xl font-bold">
                                    Need assistance locating a student record or form?
                                </h3>
                                <p className="text-xs sm:text-sm text-blue-100 max-w-xl">
                                    The Dean of Student Affairs Office is available
                                    Monday to Friday (8:00 AM – 5:00 PM). You can also
                                    visit our interactive Help Center for tutorials.
                                </p>
                            </div>

                            <div className="flex flex-wrap items-center gap-3 shrink-0">
                                <Link
                                    href="/help"
                                    className="rounded-xl bg-white px-5 py-3 text-xs font-bold text-[#000D6A] shadow-md transition-all hover:bg-[#8CE4FF] hover:text-[#000D6A]"
                                >
                                    Visit Help Center
                                </Link>
                                <Link
                                    href="/#contact"
                                    className="rounded-xl border border-white/30 bg-white/10 px-5 py-3 text-xs font-bold text-white transition-all hover:bg-white/20"
                                >
                                    Contact DSA Office
                                </Link>
                            </div>
                        </div>
                    </div>
                </main>

                <LandingFooter />
            </div>
        </>
    );
}
