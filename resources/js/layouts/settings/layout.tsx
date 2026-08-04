import { Link } from '@inertiajs/react';
import { Lock, Palette, Settings, Shield, User } from 'lucide-react';
import type { PropsWithChildren } from 'react';
import { useCurrentUrl } from '@/hooks/use-current-url';
import { cn, toUrl } from '@/lib/utils';
import type { NavItem } from '@/types';

const sidebarNavItems: NavItem[] = [
    {
        title: 'Profile',
        href: '/settings/profile',
        icon: User,
    },
    {
        title: 'Password',
        href: '/settings/password',
        icon: Lock,
    },
    {
        title: 'Two-Factor Auth',
        href: '/settings/two-factor',
        icon: Shield,
    },
    {
        title: 'Appearance',
        href: '/settings/appearance',
        icon: Palette,
    },
];

export default function SettingsLayout({ children }: PropsWithChildren) {
    const { isCurrentUrl } = useCurrentUrl();

    return (
        <div className="min-h-[calc(100vh-4rem)] bg-slate-100 dark:bg-slate-950">
            <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 py-6 sm:px-6 lg:px-8">
                {/* Page header — consistent with admin dashboard pages */}
                <div className="rounded-2xl bg-gradient-to-r from-[#0b2d66] to-[#1e40af] px-6 py-6 text-white shadow-sm sm:px-7">
                    <div className="flex items-center gap-4">
                        <div className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-white/15 backdrop-blur-sm">
                            <Settings className="h-6 w-6 text-white" aria-hidden />
                        </div>
                        <div className="min-w-0">
                            <h1 className="text-lg font-semibold tracking-tight sm:text-xl">Account settings</h1>
                            <p className="mt-0.5 text-sm text-white/80">
                                Manage your profile, security, and display preferences
                            </p>
                        </div>
                    </div>
                </div>

                <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:gap-8">
                    {/* Settings navigation — visibility & recognition (Nielsen) */}
                    <aside className="w-full shrink-0 lg:w-56 xl:w-60" aria-label="Settings sections">
                        <nav className="rounded-xl border border-slate-200/80 bg-white p-2 shadow-sm dark:border-slate-700 dark:bg-slate-900">
                            <p className="px-3 pb-2 pt-1 text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                                Settings
                            </p>
                            <ul className="flex flex-col gap-0.5" role="list">
                                {sidebarNavItems.map((item, index) => {
                                    const active = isCurrentUrl(item.href);
                                    const Icon = item.icon;
                                    return (
                                        <li key={`${toUrl(item.href)}-${index}`}>
                                            <Link
                                                href={item.href}
                                                aria-current={active ? 'page' : undefined}
                                                className={cn(
                                                    'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
                                                    active
                                                        ? 'bg-[#23509A] text-white shadow-sm'
                                                        : 'text-slate-700 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800',
                                                )}
                                            >
                                                {Icon && (
                                                    <Icon
                                                        className={cn(
                                                            'h-4 w-4 shrink-0',
                                                            active ? 'text-white' : 'text-slate-500 dark:text-slate-400',
                                                        )}
                                                        aria-hidden
                                                    />
                                                )}
                                                <span>{item.title}</span>
                                            </Link>
                                        </li>
                                    );
                                })}
                            </ul>
                        </nav>
                    </aside>

                    {/* Main content — grouped sections, readable line length */}
                    <div className="min-w-0 flex-1">
                        <div className="space-y-6">{children}</div>
                    </div>
                </div>
            </div>
        </div>
    );
}
