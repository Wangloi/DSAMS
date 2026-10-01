import { cn } from '@/lib/utils';
import {
    adminAttendance,
    adminDashboard,
    adminEvents,
    adminManageUsers,
} from '@/routes';
import { Link, usePage } from '@inertiajs/react';
import {
    CalendarDays,
    LayoutGrid,
    Menu,
    NotepadText,
    Users,
} from 'lucide-react';

interface BottomNavItem {
    label: string;
    href: string;
    icon: React.ComponentType<{ className?: string }>;
    isActive: (url: string) => boolean;
}

const navItems: BottomNavItem[] = [
    {
        label: 'Dashboard',
        href: adminDashboard(),
        icon: LayoutGrid,
        isActive: (url: string) =>
            url === '/admin-dashboard' ||
            url === '/admin/dashboard' ||
            url === '/dashboard' ||
            url === '/admin',
    },
    {
        label: 'Events',
        href: adminEvents(),
        icon: CalendarDays,
        isActive: (url: string) => url.startsWith('/admin/events'),
    },
    {
        label: 'Attendance',
        href: adminAttendance(),
        icon: NotepadText,
        isActive: (url: string) =>
            url.startsWith('/admin/attendance') ||
            url.startsWith('/admin/qr-scanner'),
    },
    {
        label: 'Users',
        href: adminManageUsers(),
        icon: Users,
        isActive: (url: string) =>
            url.startsWith('/admin/manage-users') ||
            url.startsWith('/admin/programs'),
    },
];

export function AdminBottomNavBar() {
    const { url } = usePage();

    const handleOpenMobileMenu = () => {
        window.dispatchEvent(new CustomEvent('dsams:open-admin-mobile-menu'));
    };

    return (
        <nav
            aria-label="Admin mobile navigation"
            className="fixed inset-x-0 bottom-0 z-40 block border-t border-slate-200/80 bg-white/95 pb- safe backdrop-blur-xl transition-all duration-300 lg:hidden dark:border-white/10 dark:bg-[#0B192C]/95 dark:shadow-[0_-4px_25px_rgba(0,0,0,0.4)] shadow-[0_-4px_20px_rgba(0,0,0,0.06)]"
        >
            <div className="mx-auto flex max-w-md items-center justify-around px-2 py-1.5 sm:px-4">
                {navItems.map((item) => {
                    const active = item.isActive(url);
                    const Icon = item.icon;

                    return (
                        <Link
                            key={item.label}
                            href={item.href}
                            prefetch
                            className={cn(
                                'group relative flex flex-1 flex-col items-center justify-center py-1 transition-all duration-200 active:scale-90',
                                active
                                    ? 'text-blue-600 dark:text-blue-400'
                                    : 'text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200',
                            )}
                        >
                            <div
                                className={cn(
                                    'relative flex h-8 w-12 items-center justify-center rounded-xl transition-all duration-200',
                                    active
                                        ? 'bg-blue-600/10 text-blue-600 dark:bg-blue-500/20 dark:text-blue-400'
                                        : 'group-hover:bg-slate-100 dark:group-hover:bg-slate-800/60',
                                )}
                            >
                                <Icon className="h-5 w-5 transition-transform duration-200 group-hover:scale-110" />
                                {active && (
                                    <span className="absolute -bottom-1 h-1 w-5 rounded-full bg-blue-600 dark:bg-blue-400 shadow-sm shadow-blue-500/50" />
                                )}
                            </div>
                            <span
                                className={cn(
                                    'mt-0.5 text-[10px] font-bold tracking-tight transition-colors',
                                    active
                                        ? 'font-extrabold text-blue-600 dark:text-blue-400'
                                        : 'text-slate-500 dark:text-slate-400',
                                )}
                            >
                                {item.label}
                            </span>
                        </Link>
                    );
                })}

                {/* More / All Modules button */}
                <button
                    type="button"
                    onClick={handleOpenMobileMenu}
                    aria-label="Open complete admin navigation"
                    className="group relative flex flex-1 flex-col items-center justify-center py-1 text-slate-500 transition-all duration-200 active:scale-90 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200 cursor-pointer"
                >
                    <div className="relative flex h-8 w-12 items-center justify-center rounded-xl transition-all duration-200 group-hover:bg-slate-100 dark:group-hover:bg-slate-800/60">
                        <Menu className="h-5 w-5 transition-transform duration-200 group-hover:scale-110" />
                    </div>
                    <span className="mt-0.5 text-[10px] font-bold tracking-tight text-slate-500 dark:text-slate-400">
                        More
                    </span>
                </button>
            </div>
        </nav>
    );
}

export default AdminBottomNavBar;
