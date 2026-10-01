import {
    adminActivityLog,
    adminAdmissionSlip,
    adminAnalytics,
    adminArchive,
    adminAttendance,
    adminDashboard,
    adminEvents,
    adminEvaluation,
    adminHelp,
    adminIncidentsViolations,
    adminManageUsers,
    adminNotifications,
    adminReports,
    logout,
    programHeadActivityLog,
    programHeadAttendance,
    programHeadCalendarEvents,
    programHeadDashboard,
    programHeadHelp,
    programHeadNotifications,
    programHeadReports,
    programHeadStudents,
    programHeadViolations,
} from '@/routes';
import type { NavItem, SharedData } from '@/types';
import { Link, usePage } from '@inertiajs/react';
import {
    Activity,
    Archive,
    BarChart3,
    Bell,
    CalendarDays,
    ClipboardList,
    FileText,
    GraduationCap,
    HelpCircle,
    KeyRound,
    Layers,
    LayoutGrid,
    LogOut,
    Megaphone,
    NotepadText,
    QrCode,
    Search,
    Shield,
    ShieldAlert,
    UserRoundCog,
    Users,
} from 'lucide-react';
import { useInitials } from '@/hooks/use-initials';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useState } from 'react';

interface MobileNavigationProps {
    onNavigate?: () => void;
}

interface NavSection {
    label: string;
    items: {
        title: string;
        href: string;
        icon: React.ComponentType<{ className?: string }>;
        badge?: string;
    }[];
}

export function MobileNavigation({ onNavigate }: MobileNavigationProps) {
    const { url, props } = usePage<SharedData>();
    const user = props.auth?.user;
    const getInitials = useInitials();
    const isProgramHead = url.startsWith('/program-head') || (user as any)?.role === 'program_head';

    const [isUsersExpanded, setIsUsersExpanded] = useState(() =>
        url.startsWith('/admin/manage-users')
    );

    const normalizePath = (href: string) => {
        try {
            return new URL(href, window.location.origin).pathname;
        } catch {
            return href.split('?')[0];
        }
    };

    const isItemActive = (href: string) => {
        const path = normalizePath(href);
        if (!path) return false;

        // If target has query param (e.g. ?tab=users), check matching param
        if (href.includes('?')) {
            const [base, query] = href.split('?');
            return url.includes(base) && url.includes(query);
        }

        if (path === '/admin-dashboard' || path === '/program-head-dashboard') {
            return url === path || url === '/admin' || url === '/program-head';
        }

        return url === path || url.startsWith(path + '/');
    };

    // Program Head Specific Sections
    const programHeadSections: NavSection[] = [
        {
            label: 'Core Services',
            items: [
                {
                    title: 'Dashboard',
                    href: programHeadDashboard(),
                    icon: LayoutGrid,
                },
                {
                    title: 'Students Directory',
                    href: programHeadStudents(),
                    icon: GraduationCap,
                },
                {
                    title: 'Attendance Sessions',
                    href: programHeadAttendance(),
                    icon: Users,
                },
                {
                    title: 'Event Management',
                    href: programHeadCalendarEvents(),
                    icon: CalendarDays,
                },
            ],
        },
        {
            label: 'Discipline & Reports',
            items: [
                {
                    title: 'Incidents & Violations',
                    href: programHeadViolations(),
                    icon: ShieldAlert,
                },
                {
                    title: 'Academic Reports',
                    href: programHeadReports(),
                    icon: FileText,
                },
                {
                    title: 'Activity Logs',
                    href: programHeadActivityLog(),
                    icon: Activity,
                },
                {
                    title: 'Help Center',
                    href: programHeadHelp(),
                    icon: HelpCircle,
                },
            ],
        },
    ];

    // Admin Sections
    const adminSections: NavSection[] = [
        {
            label: 'Command Center',
            items: [
                {
                    title: 'Dashboard',
                    href: adminDashboard(),
                    icon: LayoutGrid,
                },
                {
                    title: 'Events Management',
                    href: adminEvents(),
                    icon: CalendarDays,
                },
                {
                    title: 'Attendance & Sessions',
                    href: adminAttendance(),
                    icon: NotepadText,
                },
                {
                    title: 'Live QR Scanner Portal',
                    href: '/admin/attendance/scanner-portal',
                    icon: QrCode,
                },
            ],
        },
        {
            label: 'Student Affairs & Records',
            items: [
                {
                    title: 'Admission Slips',
                    href: adminAdmissionSlip(),
                    icon: ClipboardList,
                },
                {
                    title: 'Incidents & Violations',
                    href: adminIncidentsViolations(),
                    icon: ShieldAlert,
                },
                {
                    title: 'Evaluation Surveys',
                    href: adminEvaluation(),
                    icon: UserRoundCog,
                },
                {
                    title: 'Announcements',
                    href: '/admin/announcements',
                    icon: Megaphone,
                },
                {
                    title: 'Lost and Found',
                    href: '/admin/lost-found',
                    icon: Search,
                },
            ],
        },
        {
            label: 'Analytics & Audit',
            items: [
                {
                    title: 'System Analytics',
                    href: adminAnalytics(),
                    icon: BarChart3,
                },
                {
                    title: 'Official Reports',
                    href: adminReports(),
                    icon: FileText,
                },
                {
                    title: 'Archive Database',
                    href: adminArchive(),
                    icon: Archive,
                },
                {
                    title: 'Activity Log',
                    href: adminActivityLog(),
                    icon: Activity,
                },
                {
                    title: 'Help & Guidelines',
                    href: adminHelp(),
                    icon: HelpCircle,
                },
            ],
        },
    ];

    const sections = isProgramHead ? programHeadSections : adminSections;

    const baseButtonClassName =
        'relative flex items-center justify-between h-11 w-full rounded-xl px-3.5 text-sm font-semibold transition-all duration-200 group';

    return (
        <div className="flex h-full flex-col bg-white dark:bg-[#0B192C]">
            {/* User Profile Card Header */}
            <div className="border-b border-slate-100 bg-slate-50/80 px-4 py-3.5 dark:border-white/10 dark:bg-white/5">
                <div className="flex items-center gap-3">
                    <Avatar className="h-10 w-10 ring-2 ring-blue-600/30">
                        <AvatarImage src={(user as any)?.avatar} alt={user?.name || 'User'} />
                        <AvatarFallback className="bg-gradient-to-br from-blue-600 to-indigo-700 text-xs font-bold text-white">
                            {user?.name ? getInitials(user.name) : 'AD'}
                        </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-bold text-slate-900 dark:text-white">
                            {user?.name || (isProgramHead ? 'Program Head' : 'Administrator')}
                        </p>
                        <div className="flex items-center gap-1.5">
                            <span className="inline-flex items-center rounded-md bg-blue-500/10 px-1.5 py-0.5 text-[10px] font-bold text-blue-600 dark:bg-blue-400/20 dark:text-blue-300">
                                {isProgramHead ? 'Program Head' : 'System Admin'}
                            </span>
                            <span className="truncate text-[11px] text-slate-500 dark:text-slate-400">
                                {user?.email}
                            </span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Scrollable Navigation Body */}
            <div className="flex-1 overflow-y-auto px-3.5 py-4 pb-20">
                <div className="space-y-6">
                    {/* If Admin, render Manage Users with nested tabs */}
                    {!isProgramHead && (
                        <div className="space-y-1">
                            <div className="mb-1.5 px-3 text-[10px] font-black tracking-widest text-slate-400 uppercase dark:text-slate-500">
                                User Administration
                            </div>

                            <button
                                type="button"
                                onClick={() => setIsUsersExpanded((prev) => !prev)}
                                className={`${baseButtonClassName} ${
                                    url.startsWith('/admin/manage-users')
                                        ? 'bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300'
                                        : 'text-slate-700 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800'
                                }`}
                            >
                                <div className="flex items-center gap-3">
                                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-500/10 text-blue-600 dark:bg-blue-400/20 dark:text-blue-300">
                                        <Users className="h-4 w-4" />
                                    </div>
                                    <span>Manage Users</span>
                                </div>
                                <span className="text-xs font-bold text-slate-400">
                                    {isUsersExpanded ? '−' : '+'}
                                </span>
                            </button>

                            {isUsersExpanded && (
                                <div className="ml-5 mt-1 space-y-1 border-l-2 border-slate-200 pl-3 dark:border-slate-800">
                                    {[
                                        {
                                            title: 'Students Directory',
                                            href: '/admin/manage-users?tab=users',
                                            icon: Users,
                                        },
                                        {
                                            title: 'Program Heads',
                                            href: '/admin/manage-users?tab=program-heads',
                                            icon: GraduationCap,
                                        },
                                        {
                                            title: 'Programs & Courses',
                                            href: '/admin/manage-users?tab=programs',
                                            icon: Layers,
                                        },
                                        {
                                            title: 'Password Resets',
                                            href: '/admin/manage-users?tab=password-resets',
                                            icon: KeyRound,
                                        },
                                    ].map((sub) => {
                                        const active = isItemActive(sub.href);
                                        const SubIcon = sub.icon;
                                        return (
                                            <Link
                                                key={sub.title}
                                                href={sub.href}
                                                onClick={onNavigate}
                                                className={`flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-xs font-medium transition-all ${
                                                    active
                                                        ? 'bg-blue-600 text-white font-bold shadow-sm'
                                                        : 'text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800'
                                                }`}
                                            >
                                                <SubIcon className="h-3.5 w-3.5" />
                                                <span>{sub.title}</span>
                                            </Link>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    )}

                    {/* Standard Sections */}
                    {sections.map((section) => (
                        <div key={section.label} className="space-y-1">
                            <div className="mb-1.5 px-3 text-[10px] font-black tracking-widest text-slate-400 uppercase dark:text-slate-500">
                                {section.label}
                            </div>
                            {section.items.map((item) => {
                                const active = isItemActive(item.href);
                                const Icon = item.icon;

                                return (
                                    <Link
                                        key={item.title}
                                        href={item.href}
                                        onClick={onNavigate}
                                        prefetch
                                        className={`${baseButtonClassName} ${
                                            active
                                                ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md shadow-blue-500/25 font-bold'
                                                : 'text-slate-700 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800'
                                        }`}
                                    >
                                        <div className="flex items-center gap-3">
                                            <div
                                                className={`flex h-8 w-8 items-center justify-center rounded-lg transition-colors ${
                                                    active
                                                        ? 'bg-white/20 text-white'
                                                        : 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400 group-hover:text-blue-600 dark:group-hover:text-blue-400'
                                                }`}
                                            >
                                                <Icon className="h-4 w-4" />
                                            </div>
                                            <span>{item.title}</span>
                                        </div>

                                        {item.badge && (
                                            <span
                                                className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                                                    active
                                                        ? 'bg-white/20 text-white'
                                                        : 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300'
                                                }`}
                                            >
                                                {item.badge}
                                            </span>
                                        )}
                                    </Link>
                                );
                            })}
                        </div>
                    ))}
                </div>
            </div>

            {/* Bottom Actions (Logout & Close) */}
            <div className="border-t border-slate-200/80 bg-slate-50/90 p-3 dark:border-white/10 dark:bg-slate-900/90">
                <Link
                    href={logout()}
                    method="post"
                    as="button"
                    onClick={onNavigate}
                    className="flex h-10 w-full items-center justify-center gap-2 rounded-xl border border-red-200 bg-red-50 text-xs font-bold text-red-600 transition-colors hover:bg-red-100 active:scale-98 dark:border-red-900/40 dark:bg-red-950/20 dark:text-red-400 dark:hover:bg-red-950/40"
                >
                    <LogOut className="h-4 w-4" />
                    <span>Sign Out of Administrator Account</span>
                </Link>
            </div>
        </div>
    );
}

export default MobileNavigation;
