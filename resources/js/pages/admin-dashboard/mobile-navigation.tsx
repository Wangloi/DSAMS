import { Link, usePage } from '@inertiajs/react';
import {
    Activity,
    Archive,
    BarChart3,
    ClipboardList,
    LayoutGrid,
    NotepadText,
    ShieldAlert,
    UserRoundCog,
    Users,
} from 'lucide-react';
import {
    adminDashboard,
    adminManageUsers,
    adminAdmissionSlip,
    adminIncidentsViolations,
    adminAttendance,
    adminAnalytics,
    adminReports,
    adminEvaluation,
    adminArchive,
    adminActivityLog,
} from '@/routes';
import type { NavItem } from '@/types';

const adminNavItems: NavItem[] = [
    {
        title: 'Dashboard',
        href: adminDashboard(),
        icon: LayoutGrid,
    },
    {
        title: 'Manage Users',
        href: adminManageUsers(),
        icon: Users,
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

export function MobileNavigation() {
    const { url } = usePage();

    const normalizePath = (href: NavItem['href']) => {
        const hrefString = typeof href === 'string' ? href : (href as { url?: string })?.url;
        if (!hrefString) return '';
        try {
            return new URL(hrefString, window.location.origin).pathname;
        } catch {
            return hrefString;
        }
    };

    const isItemActive = (href: NavItem['href']) => {
        const path = normalizePath(href);
        if (!path) return false;
        return url === path || url.startsWith(path + '/');
    };

    const baseButtonClassName =
        'relative flex items-center gap-3 h-12 rounded-xl px-4 text-sm font-semibold transition-all duration-200 group';

    const topNavItems = adminNavItems.slice(0, 2);
    const middleNavItems = adminNavItems.slice(2, 8);
    const bottomNavItems = adminNavItems.slice(8);

    return (
        <div className="flex flex-col h-full bg-white dark:bg-[#0B192C]">
            <div className="flex-1 overflow-y-auto py-8 px-4">
                <div className="space-y-8">
                    {/* Top Navigation */}
                    <div className="space-y-1.5">
                        <div className="px-4 mb-2 text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                            General
                        </div>
                        {topNavItems.map((item) => {
                            const active = isItemActive(item.href);
                            return (
                                <Link
                                    key={item.title}
                                    href={item.href}
                                    prefetch
                                    className={`${baseButtonClassName} ${
                                        active 
                                            ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/30' 
                                            : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                                    }`}
                                >
                                    {item.icon && <item.icon className={`h-5 w-5 ${active ? 'text-white' : 'text-slate-500 dark:text-slate-400'}`} />}
                                    <span>{item.title}</span>
                                </Link>
                            );
                        })}
                    </div>

                    {/* Middle Navigation */}
                    <div className="space-y-1.5">
                        <div className="px-4 mb-2 text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                            Services & Tools
                        </div>
                        {middleNavItems.map((item) => {
                            const active = isItemActive(item.href);
                            return (
                                <Link
                                    key={item.title}
                                    href={item.href}
                                    prefetch
                                    className={`${baseButtonClassName} ${
                                        active 
                                            ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/30' 
                                            : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                                    }`}
                                >
                                    {item.icon && <item.icon className={`h-5 w-5 ${active ? 'text-white' : 'text-slate-500 dark:text-slate-400'}`} />}
                                    <span>{item.title}</span>
                                </Link>
                            );
                        })}
                    </div>

                    {/* Bottom Navigation */}
                    <div className="space-y-1.5 pb-8">
                        <div className="px-4 mb-2 text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                            Analytics & Logs
                        </div>
                        {bottomNavItems.map((item) => {
                            const active = isItemActive(item.href);
                            return (
                                <Link
                                    key={item.title}
                                    href={item.href}
                                    prefetch
                                    className={`${baseButtonClassName} ${
                                        active 
                                            ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/30' 
                                            : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                                    }`}
                                >
                                    {item.icon && <item.icon className={`h-5 w-5 ${active ? 'text-white' : 'text-slate-500 dark:text-slate-400'}`} />}
                                    <span>{item.title}</span>
                                </Link>
                            );
                        })}
                    </div>
                </div>
            </div>
        </div>
    );
}
