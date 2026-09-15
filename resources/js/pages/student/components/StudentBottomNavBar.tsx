import { DetailedHelpCenterModal } from '@/components/DetailedHelpCenterModal';
import { cn } from '@/lib/utils';
import {
    studentAdmissionSlipIndex,
    studentCertificates,
    studentDashboard,
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
import { useState } from 'react';

interface BottomNavItem {
    title: string;
    href?: string;
    icon: React.ComponentType<{ className?: string }>;
    isHelpAction?: boolean;
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
        icon: HelpCircle,
        isHelpAction: true,
    },
];

export function StudentBottomNavBar() {
    const { url } = usePage();
    const page = usePage<SharedData>();
    const [helpOpen, setHelpOpen] = useState(false);

    const unreadCount = Number(
        (page.props as any)?.unreadNotifications ?? 0,
    );

    const isItemActive = (href?: string) => {
        if (!href) return false;
        if (href === studentDashboard()) {
            return url === href;
        }
        return url === href || url.startsWith(href + '/');
    };

    return (
        <>
            {/* Detailed Help Center Modal (Triggered by Help tab) */}
            <DetailedHelpCenterModal
                open={helpOpen}
                onOpenChange={setHelpOpen}
                role="student"
            />

            {/* Mobile Bottom Navigation Bar Container */}
            <div className="fixed inset-x-0 bottom-0 z-40 block lg:hidden">
                {/* Safe floating wrapper with subtle backdrop blur & shadow */}
                <div className="mx-auto max-w-lg px-3 pb-2 sm:pb-3">
                    <nav
                        aria-label="Student Mobile Navigation"
                        className="relative flex h-16 items-center justify-around rounded-2xl border border-slate-200/80 bg-white/95 px-2 shadow-[0_-4px_25px_rgba(0,0,0,0.08)] backdrop-blur-xl transition-all duration-300 dark:border-white/10 dark:bg-[#0B192C]/95 dark:shadow-[0_-4px_25px_rgba(0,0,0,0.4)]"
                    >
                        {navItems.map((item) => {
                            const active = item.href ? isItemActive(item.href) : false;
                            const hasBadge =
                                item.badgeKey === 'unreadNotifications' && unreadCount > 0;
                            const IconComponent = item.icon;

                            if (item.isHelpAction) {
                                return (
                                    <button
                                        key={item.title}
                                        type="button"
                                        onClick={() => setHelpOpen(true)}
                                        className={cn(
                                            'relative flex flex-col items-center justify-center gap-1 py-1.5 px-3 rounded-xl transition-all duration-200 focus:outline-none select-none',
                                            'text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white',
                                        )}
                                        aria-label="Help & Guidelines"
                                    >
                                        <div className="flex h-6 w-6 items-center justify-center">
                                            <IconComponent className="h-5 w-5 transition-transform duration-200 active:scale-90" />
                                        </div>
                                        <span className="text-[10px] font-semibold tracking-tight">
                                            {item.title}
                                        </span>
                                    </button>
                                );
                            }

                            return (
                                <Link
                                    key={item.title}
                                    href={item.href || '#'}
                                    prefetch
                                    className={cn(
                                        'relative flex items-center justify-center transition-all duration-200 select-none',
                                        active
                                            ? 'gap-1.5 rounded-full bg-blue-600/10 px-3.5 py-1.5 font-bold text-blue-600 dark:bg-blue-500/20 dark:text-blue-400'
                                            : 'flex-col gap-1 py-1.5 px-3 rounded-xl text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white',
                                    )}
                                    aria-current={active ? 'page' : undefined}
                                >
                                    <div className="relative flex h-6 w-6 items-center justify-center">
                                        <IconComponent
                                            className={cn(
                                                'h-5 w-5 transition-transform duration-200 active:scale-90',
                                                active
                                                    ? 'text-blue-600 dark:text-blue-400'
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
                                            'transition-all duration-200',
                                            active
                                                ? 'text-xs font-bold'
                                                : 'text-[10px] font-semibold tracking-tight',
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
        </>
    );
}
