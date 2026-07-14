import { Link, usePage, router } from '@inertiajs/react';
import { Bell, ChevronDown } from 'lucide-react';
import { useState } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { UserMenuContent } from '@/components/user-menu-content';
import { useAppearance } from '@/hooks/use-appearance';
import { useInitials } from '@/hooks/use-initials';
import { cn } from '@/lib/utils';
import { studentAttendanceScannerPortal, studentDashboard, studentEvaluationShow, studentNotifications } from '@/routes';
import type { SharedData } from '@/types';
import axios from 'axios';

export function StudentHeader() {
    const page = usePage<SharedData>();
    const { auth } = page.props;
    const getInitials = useInitials();
    const { resolvedAppearance, updateAppearance } = useAppearance();
    const [locallyRead, setLocallyRead] = useState<string[]>([]);
    const [bellClicked, setBellClicked] = useState(false);

    const recentNotifications = ((page.props as any)?.recentNotifications ?? []) as Array<{
        id: string;
        type?: string;
        eventId?: number | string | null;
        evaluationId?: number | string | null;
        title: string;
        subtitle?: string;
        timeAgo?: string;
        is_read?: boolean;
    }>;

    const dashboardNotifications = ((page.props as any)?.notifications ?? []) as Array<{
        id: string;
        type?: string;
        eventId?: number | string | null;
        evaluationId?: number | string | null;
        title: string;
        subtitle?: string;
        timeAgo?: string;
        is_read?: boolean;
    }>;

    const notificationsToRender = recentNotifications.length > 0 ? recentNotifications : dashboardNotifications;
    const unreadNotifications = bellClicked ? 0 : notificationsToRender.filter(n => !n.is_read && !locallyRead.includes(n.id)).length;

    const handleNotificationBellClick = () => {
        setBellClicked(true);
    };

    const markSingleAsRead = (id: string, e: React.MouseEvent) => {
        // Prevent navigating if it's already read, or if they clicked a link
        if ((e.target as HTMLElement).closest('a')) return;

        const n = notificationsToRender.find(notif => notif.id === id);
        if (n && !n.is_read && !locallyRead.includes(id)) {
            setLocallyRead(prev => [...prev, id]);
            axios.post(`/notifications/${id}/mark-read`).catch(console.error);
        }
    };

    const propsAny = page.props as unknown as Record<string, any>;
    const user = auth?.user ?? propsAny?.auth?.user ?? propsAny?.auth?.user?.data ?? propsAny?.user;
    const defaultUser = { name: 'Student', avatar: null };
    const displayUser = user || defaultUser;
    const displayName =
        (typeof displayUser?.name === 'string' && displayUser.name.trim() !== ''
            ? displayUser.name
            : typeof (displayUser as any)?.student_id === 'string' && (displayUser as any).student_id.trim() !== ''
                ? (displayUser as any).student_id
                : typeof displayUser?.email === 'string' && displayUser.email.trim() !== ''
                    ? displayUser.email
                    : defaultUser.name) ?? defaultUser.name;
    const subtitleLabel = displayUser ? 'Student' : undefined;

    return (
        <header className="fixed inset-x-0 top-0 z-50 bg-gradient-to-r from-[#0b2d66] via-[#103875] to-[#1e40af] dark:from-transparent dark:via-transparent dark:to-transparent dark:bg-[#0B192C] backdrop-blur-xl border-b border-white/10 transition-all duration-300">
            <div className="flex h-16 w-full items-center px-4 max-w-7xl mx-auto sm:px-6 lg:px-8">
                <Link
                    href={studentDashboard()}
                    prefetch
                    className="flex items-center gap-2 sm:gap-3 lg:ml-0 group"
                >
                    <div className="flex items-center gap-1 sm:gap-2">
                        <img
                            src="/images/SRCB.png"
                            alt="SRCB Logo"
                            className="h-8 w-8 sm:h-10 sm:w-10 rounded-full bg-white object-cover shadow-sm group-hover:scale-105 transition-transform duration-300"
                        />
                        <img
                            src="/images/DSA.png"
                            alt="DSA Logo"
                            className="h-8 w-8 sm:h-10 sm:w-10 rounded-full bg-white object-cover shadow-sm group-hover:scale-105 transition-transform duration-300"
                        />
                    </div>
                    <div className="leading-tight hidden sm:block">
                        <div className="flex flex-wrap items-center gap-1 sm:gap-2 text-white">
                            <div className="text-base sm:text-lg font-bold tracking-wide">OSAMS</div>
                            <div className="text-white/50 hidden md:block">/</div>
                            <div className="text-xs font-semibold text-white/90 hidden lg:block">Office of Student Affairs Management System</div>
                        </div>
                        <div className="text-[10px] sm:text-[11px] font-semibold text-white/80 hidden sm:block">St. Rita's College of Balingasag</div>
                    </div>
                    {/* Mobile-only title */}
                    <div className="leading-tight sm:hidden text-white">
                        <div className="text-base font-bold tracking-wide">OSAMS</div>
                    </div>
                </Link>

                <div className="ml-auto flex items-center gap-1 sm:gap-2">
                    <DropdownMenu modal={false}>
                        <DropdownMenuTrigger asChild>
                            <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                onClick={handleNotificationBellClick}
                                className="relative h-10 w-10 rounded-xl text-white hover:bg-white/10 transition-colors"
                            >
                                <Bell className="h-5 w-5" />
                                {unreadNotifications > 0 ? (
                                    <span className="absolute right-2 top-2 inline-flex h-2 w-2 items-center justify-center rounded-full bg-rose-500 ring-2 ring-[#0b2d66] dark:ring-[#051139]">
                                        <span className="absolute inset-0 rounded-full bg-rose-500 animate-ping opacity-75"></span>
                                    </span>
                                ) : null}
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent className="w-80 z-[60] rounded-2xl p-0 overflow-hidden bg-white dark:bg-[#051139] border border-slate-200 dark:border-white/10 shadow-2xl" align="end">
                            <div className="px-5 py-4 bg-slate-50 dark:bg-white/5 border-b border-slate-100 dark:border-white/10">
                                <h3 className="text-xs font-black uppercase tracking-widest text-slate-500 dark:text-white/60">Notifications</h3>
                            </div>

                            <div className="max-h-80 overflow-y-auto">
                                {notificationsToRender.length > 0 ? (
                                    notificationsToRender.map((n) => {
                                        const isRead = n.is_read || locallyRead.includes(n.id);
                                        return (
                                            <div
                                                key={n.id}
                                                onClick={(e) => !isRead && markSingleAsRead(n.id, e)}
                                                className={cn(
                                                    "px-5 py-4 border-b border-slate-50 dark:border-white/5 transition-colors group",
                                                    isRead
                                                        ? "opacity-60 bg-transparent cursor-default"
                                                        : "cursor-pointer hover:bg-slate-50 dark:hover:bg-white/5"
                                                )}
                                            >
                                                <div className="flex flex-col gap-1">
                                                    <p className={cn(
                                                        "text-sm transition-colors",
                                                        isRead ? "font-medium text-slate-700 dark:text-white/70" : "font-bold text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400"
                                                    )}>{n.title}</p>
                                                    {n.subtitle && (
                                                        <p className="text-xs text-slate-500 dark:text-white/60 font-medium leading-relaxed">{n.subtitle}</p>
                                                    )}
                                                    <div className="flex items-center justify-between mt-2">
                                                        {n.timeAgo && (
                                                            <p className="text-[10px] font-bold text-slate-400 dark:text-white/40 uppercase tracking-tight">{n.timeAgo}</p>
                                                        )}

                                                        {n.type === 'scanner_portal_access_granted' && n.eventId && (
                                                            <Link
                                                                href={studentAttendanceScannerPortal(n.eventId)}
                                                                className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-3 py-1.5 text-[10px] font-black uppercase tracking-widest text-white hover:bg-blue-700 transition-colors shadow-sm"
                                                            >
                                                                Open Scanner
                                                            </Link>
                                                        )}
                                                        {n.type === 'evaluation_available' && n.evaluationId && (
                                                            <Link
                                                                href={studentEvaluationShow(n.evaluationId)}
                                                                className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-3 py-1.5 text-[10px] font-black uppercase tracking-widest text-white hover:bg-blue-700 transition-colors shadow-sm"
                                                            >
                                                                Evaluate
                                                            </Link>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })
                                ) : (
                                    <div className="px-5 py-10 text-center flex flex-col items-center gap-3">
                                        <div className="h-12 w-12 rounded-2xl bg-slate-50 dark:bg-white/5 flex items-center justify-center">
                                            <Bell className="h-6 w-6 text-slate-300 dark:text-white/20" />
                                        </div>
                                        <div>
                                            <p className="text-xs font-bold text-slate-600 dark:text-white/80">All caught up!</p>
                                            <p className="mt-1 text-[10px] font-medium text-slate-400 dark:text-white/40 max-w-[200px] mx-auto">
                                                Updates on events and evaluations will appear here.
                                            </p>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {notificationsToRender.length > 0 && (
                                <div className="p-3 bg-slate-50/50 dark:bg-white/5 border-t border-slate-100 dark:border-white/10">
                                    <Link
                                        href={studentNotifications()}
                                        className="flex items-center justify-center w-full py-2 text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-white/60 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                                    >
                                        View all
                                    </Link>
                                </div>
                            )}
                        </DropdownMenuContent>
                    </DropdownMenu>

                    {/* User Menu */}
                    <DropdownMenu modal={false}>
                        <DropdownMenuTrigger asChild>
                            <Button
                                variant="ghost"
                                className="h-auto gap-1 sm:gap-2 rounded-full border border-white/15 bg-white/5 px-1.5 sm:px-2 py-1.5 sm:py-2 text-white hover:bg-white/15 hover:text-white"
                            >
                                <Avatar className="size-7 sm:size-8 overflow-hidden rounded-full">
                                    <AvatarImage
                                        src={displayUser.avatar}
                                        alt={displayUser.name}
                                    />
                                    <AvatarFallback className="rounded-lg bg-white/20 text-white text-xs sm:text-sm">
                                        {getInitials(displayUser.name)}
                                    </AvatarFallback>
                                </Avatar>
                                <div className="text-left leading-tight hidden md:block">
                                    <div className="text-xs sm:text-sm font-semibold truncate max-w-32">
                                        {displayUser.name}
                                    </div>
                                    {subtitleLabel && (
                                        <div className="text-xs text-white/90 hidden lg:block">
                                            {subtitleLabel}
                                        </div>
                                    )}
                                </div>
                                <ChevronDown className="hidden h-3 w-3 sm:h-4 sm:w-4 opacity-90 md:block" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent className="w-56" align="end">
                            <UserMenuContent user={displayUser} />
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            </div>
        </header>
    );
}
