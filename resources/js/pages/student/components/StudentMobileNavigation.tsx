import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useInitials } from '@/hooks/use-initials';
import {
    studentAdmissionSlipIndex,
    studentCertificates,
    studentDashboard,
    studentHelp,
    studentNotifications,
} from '@/routes';
import type { NavItem, SharedData } from '@/types';
import { Link, router, usePage } from '@inertiajs/react';
import {
    Award,
    Bell,
    ClipboardList,
    HelpCircle,
    LayoutGrid,
    LogOut,
    Settings,
    User as UserIcon,
} from 'lucide-react';

interface StudentMobileNavigationProps {
    onItemClick?: () => void;
    onOpenHelp?: () => void;
    unreadNotificationsCount?: number;
}

const mainNavItems: (NavItem & { badgeKey?: string })[] = [
    {
        title: 'Dashboard',
        href: studentDashboard(),
        icon: LayoutGrid,
    },
    {
        title: 'Admission Slips',
        href: studentAdmissionSlipIndex(),
        icon: ClipboardList,
    },
    {
        title: 'E-Certificates',
        href: studentCertificates(),
        icon: Award,
    },
    {
        title: 'Notifications',
        href: studentNotifications(),
        icon: Bell,
        badgeKey: 'notifications',
    },
];

export function StudentMobileNavigation({
    onItemClick,
    onOpenHelp,
    unreadNotificationsCount = 0,
}: StudentMobileNavigationProps) {
    const { url } = usePage();
    const page = usePage<SharedData>();
    const { auth } = page.props;
    const getInitials = useInitials();

    const propsAny = page.props as unknown as Record<string, any>;
    const user =
        auth?.user ??
        propsAny?.auth?.user ??
        propsAny?.auth?.user?.data ??
        propsAny?.user;

    const defaultUser = { name: 'Student', avatar: null };
    const displayUser = user || defaultUser;
    const displayName =
        (typeof displayUser?.name === 'string' && displayUser.name.trim() !== ''
            ? displayUser.name
            : typeof (displayUser as any)?.student_id === 'string' &&
                (displayUser as any).student_id.trim() !== ''
              ? (displayUser as any).student_id
              : typeof displayUser?.email === 'string' &&
                  displayUser.email.trim() !== ''
                ? displayUser.email
                : defaultUser.name) ?? defaultUser.name;

    const studentId = (displayUser as any)?.student_id;
    const course = (displayUser as any)?.course || (displayUser as any)?.program;
    const yearLevel = (displayUser as any)?.year_level;

    const normalizePath = (href: NavItem['href']) => {
        const hrefString =
            typeof href === 'string' ? href : (href as { url?: string })?.url;
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
        if (path === studentDashboard()) {
            return url === path;
        }
        return url === path || url.startsWith(path + '/');
    };

    const handleLogout = () => {
        onItemClick?.();
        router.flushAll();
        router.post('/logout');
    };

    const baseButtonClassName =
        'relative flex items-center justify-between h-12 rounded-xl px-4 text-sm font-semibold transition-all duration-200 group';

    return (
        <div className="flex h-full flex-col justify-between bg-white dark:bg-[#0B192C]">
            {/* Scrollable Navigation Area */}
            <div className="flex-1 overflow-y-auto px-4 py-5">
                {/* User Profile Summary Card */}
                <div className="mb-6 rounded-2xl border border-slate-200/80 bg-gradient-to-br from-slate-50 to-blue-50/50 p-4 dark:border-white/10 dark:from-white/5 dark:to-blue-950/20">
                    <div className="flex items-center gap-3.5">
                        <Avatar className="h-12 w-12 rounded-xl border border-white shadow-sm ring-2 ring-blue-500/20 dark:border-slate-800">
                            <AvatarImage src={displayUser.avatar} alt={displayName} />
                            <AvatarFallback className="rounded-xl bg-blue-600 text-sm font-bold text-white">
                                {getInitials(displayName)}
                            </AvatarFallback>
                        </Avatar>
                        <div className="min-w-0 flex-1">
                            <h4 className="truncate text-sm font-bold text-slate-900 dark:text-white">
                                {displayName}
                            </h4>
                            <p className="truncate text-xs text-slate-500 dark:text-slate-400">
                                {studentId ? `ID: ${studentId}` : displayUser.email || 'Student Portal'}
                            </p>
                            {(course || yearLevel) && (
                                <div className="mt-1.5 flex flex-wrap gap-1">
                                    {course && (
                                        <Badge
                                            variant="secondary"
                                            className="px-1.5 py-0 text-[10px] font-semibold bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300 border-0"
                                        >
                                            {course}
                                        </Badge>
                                    )}
                                    {yearLevel && (
                                        <Badge
                                            variant="secondary"
                                            className="px-1.5 py-0 text-[10px] font-semibold bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border-0"
                                        >
                                            Year {yearLevel}
                                        </Badge>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                <div className="space-y-6">
                    {/* Main Navigation Section */}
                    <div className="space-y-1.5">
                        <div className="mb-2 px-3 text-[10px] font-black tracking-widest text-slate-400 uppercase dark:text-slate-500">
                            Main Menu
                        </div>
                        {mainNavItems.map((item) => {
                            const active = isItemActive(item.href);
                            const hasBadge =
                                item.badgeKey === 'notifications' &&
                                unreadNotificationsCount > 0;

                            return (
                                <Link
                                    key={item.title}
                                    href={item.href}
                                    prefetch
                                    onClick={onItemClick}
                                    className={`${baseButtonClassName} ${
                                        active
                                            ? 'bg-blue-600 text-white shadow-md shadow-blue-500/25'
                                            : 'text-slate-700 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800/60'
                                    }`}
                                >
                                    <div className="flex items-center gap-3">
                                        {item.icon && (
                                            <item.icon
                                                className={`h-5 w-5 transition-transform duration-200 group-hover:scale-110 ${
                                                    active
                                                        ? 'text-white'
                                                        : 'text-slate-500 dark:text-slate-400'
                                                }`}
                                            />
                                        )}
                                        <span>{item.title}</span>
                                    </div>
                                    {hasBadge && (
                                        <span
                                            className={`inline-flex items-center justify-center rounded-full px-2 py-0.5 text-[10px] font-black ${
                                                active
                                                    ? 'bg-white text-blue-600'
                                                    : 'bg-rose-500 text-white'
                                            }`}
                                        >
                                            {unreadNotificationsCount}
                                        </span>
                                    )}
                                </Link>
                            );
                        })}
                    </div>

                    {/* Support & Resources Section */}
                    <div className="space-y-1.5">
                        <div className="mb-2 px-3 text-[10px] font-black tracking-widest text-slate-400 uppercase dark:text-slate-500">
                            Help & Support
                        </div>
                        <button
                            type="button"
                            onClick={() => {
                                onItemClick?.();
                                onOpenHelp?.();
                            }}
                            className={`${baseButtonClassName} w-full text-slate-700 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800/60`}
                        >
                            <div className="flex items-center gap-3">
                                <HelpCircle className="h-5 w-5 text-slate-500 transition-transform duration-200 group-hover:scale-110 dark:text-slate-400" />
                                <span>Help & Guidelines</span>
                            </div>
                        </button>
                    </div>
                </div>
            </div>

            {/* Bottom Footer / Actions */}
            <div className="border-t border-slate-100 bg-slate-50/80 p-4 dark:border-white/10 dark:bg-white/5">
                <div className="space-y-2">
                    <Link
                        href="/settings/profile"
                        prefetch
                        onClick={onItemClick}
                        className="flex h-10 w-full items-center gap-3 rounded-xl px-3 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-200/70 dark:text-slate-300 dark:hover:bg-white/10"
                    >
                        <Settings className="h-4 w-4 text-slate-500 dark:text-slate-400" />
                        <span>Profile Settings</span>
                    </Link>

                    <button
                        type="button"
                        onClick={handleLogout}
                        className="flex h-10 w-full items-center gap-3 rounded-xl px-3 text-sm font-medium text-rose-600 transition-colors hover:bg-rose-50 dark:text-rose-400 dark:hover:bg-rose-950/30"
                    >
                        <LogOut className="h-4 w-4" />
                        <span>Log out</span>
                    </button>
                </div>
            </div>
        </div>
    );
}
