import { cn } from '@/lib/utils';
import {
    studentAdmissionSlipIndex,
    studentCertificates,
    studentDashboard,
    studentHelp,
    studentNotifications,
} from '@/routes';
import type { NavItem, SharedData } from '@/types';
import { Link, usePage } from '@inertiajs/react';
import {
    Award,
    Bell,
    ClipboardList,
    HelpCircle,
    Home,
    LayoutGrid,
} from 'lucide-react';

interface BottomNavItem {
    title: string;
    href: string;
    icon: React.ComponentType<{ className?: string }>;
    badgeKey?: string;
}

const navItems: BottomNavItem[] = [
    {
        title: 'Home',
        href: studentDashboard(),
        icon: Home,
    },
    {
        title: 'Slips',
        href: studentAdmissionSlipIndex(),
        icon: ClipboardList,
    },
    {
        title: 'Certs',
        href: studentCertificates(),
        icon: Award,
    },
    {
        title: 'Alerts',
        href: studentNotifications(),
        icon: Bell,
        badgeKey: 'unreadNotifications',
    },
    {
        title: 'Help',
        href: studentHelp(),
        icon: HelpCircle,
    },
];

export function StudentBottomNavBar() {
    const { url } = usePage();
    const page = usePage<SharedData>();

    const unreadCount = Number(
        (page.props as any)?.unreadNotifications ?? 0,
    );

    const isItemActive = (href: string) => {
        if (!href) return false;
        if (href === studentDashboard()) {
            return url === href;
        }
        return url === href || url.startsWith(href + '/');
    };

    return (
        <div className="fixed inset-x-0 bottom-0 z-40 block lg:hidden pb-[max(0.5rem,env(safe-area-inset-bottom,0px))]">
            {/* Safe floating wrapper with subtle backdrop blur & shadow */}
            <div className="mx-auto max-w-lg px-3">
                <nav
                    aria-label="Student Mobile Navigation"
                    className="relative flex h-16 items-center justify-around rounded-2xl border border-slate-200/80 bg-white/95 px-1.5 shadow-[0_-4px_25px_rgba(0,0,0,0.08)] backdrop-blur-xl transition-all duration-300 dark:border-white/10 dark:bg-[#0B192C]/95 dark:shadow-[0_-4px_25px_rgba(0,0,0,0.4)]"
                >
                    {navItems.map((item) => {
                        const active = isItemActive(item.href);
                        const hasBadge =
                            item.badgeKey === 'unreadNotifications' && unreadCount > 0;
                        const IconComponent = item.icon;

                        return (
                            <Link
                                key={item.title}
                                href={item.href}
                                prefetch
                                className={cn(
                                    'relative flex flex-1 flex-col items-center justify-center py-1 transition-all duration-200 select-none rounded-xl',
                                    active
                                        ? 'text-blue-600 dark:text-blue-400 font-bold'
                                        : 'text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white',
                                )}
                                aria-current={active ? 'page' : undefined}
                            >
                                <div
                                    className={cn(
                                        'relative flex h-7 w-7 items-center justify-center rounded-xl transition-all duration-200',
                                        active
                                            ? 'bg-blue-600/10 dark:bg-blue-500/20'
                                            : '',
                                    )}
                                >
                                    <IconComponent
                                        className={cn(
                                            'h-5 w-5 transition-transform duration-200 active:scale-90',
                                            active
                                                ? 'text-blue-600 dark:text-blue-400 scale-105'
                                                : 'text-slate-500 dark:text-slate-400',
                                        )}
                                    />
                                    {hasBadge && (
                                        <span className="absolute -top-1 -right-1 flex h-3.5 min-w-3.5 items-center justify-center rounded-full bg-rose-500 px-1 text-[9px] font-black text-white shadow-sm ring-2 ring-white dark:ring-[#0B192C]">
                                            {unreadCount > 9 ? '9+' : unreadCount}
                                        </span>
                                    )}
                                </div>

                                <span
                                    className={cn(
                                        'mt-0.5 text-[10px] tracking-tight transition-all duration-200',
                                        active ? 'font-bold' : 'font-medium',
                                    )}
                                >
                                    {item.title}
                                </span>
                            </Link>
                        );
                    })}
                </nav>
            </div>
        </div>
    );
}

