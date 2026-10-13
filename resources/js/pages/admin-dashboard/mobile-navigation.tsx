import {
    adminActivityLog,
    adminAdmissionSlip,
    adminAnalytics,
    adminArchive,
    adminAttendance,
    adminDashboard,
    adminEvents,
    adminEvaluation,
    adminIncidentsViolations,
    adminManageUsers,
    adminReports,
    logout,
    programHeadActivityLog,
    programHeadAttendance,
    programHeadCalendarEvents,
    programHeadDashboard,
    programHeadHelp,
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
    CalendarDays,
    ChevronDown,
    ClipboardList,
    FileText,
    GraduationCap,
    HelpCircle,
    KeyRound,
    Layers,
    LayoutGrid,
    LogOut,
    NotepadText,
    ShieldAlert,
    UserCheck,
    UserRoundCog,
    Users,
} from 'lucide-react';
import { useInitials } from '@/hooks/use-initials';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';
import React, { useState } from 'react';

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

// Admin Services & Tools (matches desktop AdminSidebar)
const adminMiddleNavItems: NavItem[] = [
    {
        title: 'Events',
        href: adminEvents(),
        icon: CalendarDays,
    },
    {
        title: 'Admission slip',
        href: adminAdmissionSlip(),
        icon: ClipboardList,
    },
    {
        title: 'Incidents & Violations',
        href: adminIncidentsViolations(),
        icon: ShieldAlert,
    },
    {
        title: 'Attendance',
        href: adminAttendance(),
        icon: NotepadText,
    },
    {
        title: 'Evaluation',
        href: adminEvaluation(),
        icon: UserRoundCog,
    },
];

// Admin Analytics & Logs (matches desktop AdminSidebar)
const adminBottomNavItems: NavItem[] = [
    {
        title: 'Analytics',
        href: adminAnalytics(),
        icon: BarChart3,
    },
    {
        title: 'Reports',
        href: adminReports(),
        icon: ClipboardList,
    },
    {
        title: 'Archive',
        href: adminArchive(),
        icon: Archive,
    },
    {
        title: 'Activity Log',
        href: adminActivityLog(),
        icon: Activity,
    },
];

// Admin Manage Users subtabs (matches desktop AdminSidebar)
const adminManageUsersSubItems = [
    {
        tab: 'users',
        title: 'Students',
        href: '/admin/manage-users?tab=users',
        icon: UserCheck,
        iconColor: 'text-blue-600 dark:text-blue-400',
    },
    {
        tab: 'program-heads',
        title: 'Personnels',
        href: '/admin/manage-users?tab=program-heads',
        icon: GraduationCap,
        iconColor: 'text-indigo-600 dark:text-indigo-400',
    },
    {
        tab: 'programs',
        title: 'Academic Programs',
        href: '/admin/manage-users?tab=programs',
        icon: Layers,
        iconColor: 'text-cyan-600 dark:text-cyan-400',
    },
    {
        tab: 'password-resets',
        title: 'Password Resets',
        href: '/admin/manage-users?tab=password-resets',
        icon: KeyRound,
        iconColor: 'text-amber-600 dark:text-amber-400',
    },
];

export function MobileNavigation({ onNavigate }: MobileNavigationProps) {
    const { url, props } = usePage<SharedData>();
    const user = props.auth?.user;
    const getInitials = useInitials();
    const isProgramHead = url.startsWith('/program-head') || (user as any)?.role === 'program_head';

    const [isUsersExpanded, setIsUsersExpanded] = useState(() =>
        url.startsWith('/admin/manage-users')
    );

    const normalizePath = (href: NavItem['href']) => {
        const hrefString =
            typeof href === 'string' ? href : (href as { url?: string })?.url;
        if (!hrefString) return '';
        try {
            return new URL(hrefString, window.location.origin).pathname;
        } catch {
            return hrefString.split('?')[0];
        }
    };

    const isItemActive = (href: NavItem['href']) => {
        const path = normalizePath(href);
        if (!path) return false;

        if (path === '/admin-dashboard' || path === '/admin/dashboard') {
            return (
                url === '/admin-dashboard' ||
                url === '/admin/dashboard' ||
                url === '/dashboard' ||
                url === '/admin'
            );
        }

        if (path === '/program-head-dashboard') {
            return url === '/program-head-dashboard' || url === '/program-head';
        }

        // Special handling for QR scanner page - activates Attendance item
        if (url.includes('/admin/qr-scanner')) {
            return path === '/admin/attendance';
        }

        return (
            url === path ||
            url.startsWith(path + '/') ||
            url.startsWith(path + '?')
        );
    };

    const isManageUsersPath = url.startsWith('/admin/manage-users') || url.startsWith('/admin/programs');

    const isSubTabActive = (tab: string) => {
        if (!url.startsWith('/admin/manage-users')) return false;
        const search = url.split('?')[1] || '';
        const params = new URLSearchParams(search);
        const currentTab = params.get('tab');

        if (tab === 'users') {
            return !currentTab || currentTab === 'users';
        }
        return currentTab === tab;
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

    const navItemClass = (active: boolean) =>
        cn(
            'relative flex items-center justify-between h-10.5 w-full rounded-xl px-3 text-sm font-medium transition-all duration-200 cursor-pointer',
            active
                ? 'bg-blue-600 text-white font-semibold shadow-md dark:bg-blue-600/25 dark:text-blue-400'
                : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-slate-800/60 dark:hover:text-white'
        );

    const subItemClass = (active: boolean) =>
        cn(
            'flex items-center gap-2.5 h-9 rounded-lg px-2.5 text-xs font-medium transition-colors cursor-pointer',
            active
                ? 'bg-blue-50 font-bold text-blue-600 dark:bg-blue-950/40 dark:text-blue-400'
                : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800/60 dark:hover:text-white'
        );

    return (
        <div className="flex flex-1 flex-col min-h-0 overflow-hidden bg-white dark:bg-[#0B192C]">
            {/* User Profile Card Header */}
            <div className="shrink-0 border-b border-slate-100 bg-slate-50/80 px-4 py-3.5 dark:border-white/10 dark:bg-white/5">
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
            <div className="flex-1 min-h-0 overflow-y-auto px-3.5 py-4 pb-6">
                {isProgramHead ? (
                    // Program Head Nav Sections
                    <div className="space-y-6">
                        {programHeadSections.map((section) => (
                            <div key={section.label} className="space-y-1">
                                <div className="mb-2 px-3 text-[10px] font-bold tracking-wider text-slate-400 uppercase dark:text-slate-500">
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
                                            className={navItemClass(active)}
                                        >
                                            <div className="flex items-center gap-2.5 min-w-0">
                                                <Icon
                                                    className={cn(
                                                        'h-[18px] w-[18px] flex-shrink-0',
                                                        active
                                                            ? 'text-white dark:text-blue-400'
                                                            : 'text-slate-500 dark:text-slate-400'
                                                    )}
                                                />
                                                <span className="truncate">{item.title}</span>
                                            </div>
                                        </Link>
                                    );
                                })}
                            </div>
                        ))}
                    </div>
                ) : (
                    // Admin Navigation Sections (Exact 1:1 match to desktop AdminSidebar)
                    <div className="space-y-6">
                        {/* Section 1: General */}
                        <div className="space-y-1">
                            <div className="mb-2 px-3 text-[10px] font-bold tracking-wider text-slate-400 uppercase dark:text-slate-500">
                                General
                            </div>

                            {/* Dashboard */}
                            <Link
                                href={adminDashboard()}
                                onClick={onNavigate}
                                prefetch
                                className={navItemClass(isItemActive(adminDashboard()))}
                            >
                                <div className="flex items-center gap-2.5 min-w-0">
                                    <LayoutGrid
                                        className={cn(
                                            'h-[18px] w-[18px] flex-shrink-0',
                                            isItemActive(adminDashboard())
                                                ? 'text-white dark:text-blue-400'
                                                : 'text-slate-500 dark:text-slate-400'
                                        )}
                                    />
                                    <span className="truncate">Dashboard</span>
                                </div>
                            </Link>

                            {/* Manage Users (Collapsible) */}
                            <button
                                type="button"
                                onClick={() => setIsUsersExpanded((prev) => !prev)}
                                className={cn(
                                    'relative flex items-center justify-between h-10.5 w-full rounded-xl px-3 text-sm font-medium transition-all duration-200 cursor-pointer',
                                    isManageUsersPath
                                        ? 'bg-blue-50 text-blue-700 font-semibold dark:bg-blue-950/40 dark:text-blue-300'
                                        : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-slate-800/60 dark:hover:text-white'
                                )}
                            >
                                <div className="flex items-center gap-2.5 min-w-0">
                                    <Users
                                        className={cn(
                                            'h-[18px] w-[18px] flex-shrink-0',
                                            isManageUsersPath
                                                ? 'text-blue-600 dark:text-blue-400'
                                                : 'text-slate-500 dark:text-slate-400'
                                        )}
                                    />
                                    <span className="truncate">Manage Users</span>
                                </div>
                                <ChevronDown
                                    className={cn(
                                        'h-4 w-4 shrink-0 transition-transform duration-200',
                                        isManageUsersPath
                                            ? 'text-blue-600 dark:text-blue-400'
                                            : 'text-slate-400 dark:text-slate-500',
                                        isUsersExpanded && 'rotate-180'
                                    )}
                                />
                            </button>

                            {isUsersExpanded && (
                                <div className="my-1 ml-3 space-y-1 border-l-2 border-slate-200 pl-2.5 dark:border-slate-800">
                                    {adminManageUsersSubItems.map((sub) => {
                                        const active = isSubTabActive(sub.tab);
                                        const SubIcon = sub.icon;
                                        return (
                                            <Link
                                                key={sub.title}
                                                href={sub.href}
                                                onClick={onNavigate}
                                                prefetch
                                                className={subItemClass(active)}
                                            >
                                                <SubIcon className={cn('h-3.5 w-3.5 flex-shrink-0', sub.iconColor)} />
                                                <span className="truncate">{sub.title}</span>
                                            </Link>
                                        );
                                    })}
                                </div>
                            )}
                        </div>

                        {/* Section 2: Services & Tools */}
                        <div className="space-y-1">
                            <div className="mb-2 px-3 text-[10px] font-bold tracking-wider text-slate-400 uppercase dark:text-slate-500">
                                Services & Tools
                            </div>
                            {adminMiddleNavItems.map((item) => {
                                const active = isItemActive(item.href);
                                const Icon = item.icon as React.ComponentType<{ className?: string }>;
                                return (
                                    <Link
                                        key={item.title}
                                        href={item.href as string}
                                        onClick={onNavigate}
                                        prefetch
                                        className={navItemClass(active)}
                                    >
                                        <div className="flex items-center gap-2.5 min-w-0">
                                            {Icon && (
                                                <Icon
                                                    className={cn(
                                                        'h-[18px] w-[18px] flex-shrink-0',
                                                        active
                                                            ? 'text-white dark:text-blue-400'
                                                            : 'text-slate-500 dark:text-slate-400'
                                                    )}
                                                />
                                            )}
                                            <span className="truncate">{item.title}</span>
                                        </div>
                                    </Link>
                                );
                            })}
                        </div>

                        {/* Section 3: Analytics & Logs */}
                        <div className="space-y-1">
                            <div className="mb-2 px-3 text-[10px] font-bold tracking-wider text-slate-400 uppercase dark:text-slate-500">
                                Analytics & Logs
                            </div>
                            {adminBottomNavItems.map((item) => {
                                const active = isItemActive(item.href);
                                const Icon = item.icon as React.ComponentType<{ className?: string }>;
                                return (
                                    <Link
                                        key={item.title}
                                        href={item.href as string}
                                        onClick={onNavigate}
                                        prefetch
                                        className={navItemClass(active)}
                                    >
                                        <div className="flex items-center gap-2.5 min-w-0">
                                            {Icon && (
                                                <Icon
                                                    className={cn(
                                                        'h-[18px] w-[18px] flex-shrink-0',
                                                        active
                                                            ? 'text-white dark:text-blue-400'
                                                            : 'text-slate-500 dark:text-slate-400'
                                                    )}
                                                />
                                            )}
                                            <span className="truncate">{item.title}</span>
                                        </div>
                                    </Link>
                                );
                            })}
                        </div>
                    </div>
                )}
            </div>

            {/* Bottom Actions (Logout) */}
            <div className="shrink-0 border-t border-slate-200/80 bg-slate-50/90 p-3 dark:border-white/10 dark:bg-slate-900/90">
                <Link
                    href={logout()}
                    method="post"
                    as="button"
                    onClick={onNavigate}
                    className="flex h-10 w-full items-center justify-center gap-2 rounded-xl border border-red-200 bg-red-50 text-xs font-bold text-red-600 transition-colors hover:bg-red-100 active:scale-98 dark:border-red-900/40 dark:bg-red-950/20 dark:text-red-400 dark:hover:bg-red-950/40 cursor-pointer"
                >
                    <LogOut className="h-4 w-4" />
                    <span>
                        {isProgramHead
                            ? 'Sign Out of Program Head Account'
                            : 'Sign Out of Administrator Account'}
                    </span>
                </Link>
            </div>
        </div>
    );
}

export default MobileNavigation;
