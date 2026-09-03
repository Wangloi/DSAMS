import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetHeader,
    SheetTitle,
    SheetTrigger,
} from '@/components/ui/sheet';
import { UserMenuContent } from '@/components/user-menu-content';
import { useInitials } from '@/hooks/use-initials';
import { MobileNavigation } from '@/pages/admin-dashboard/mobile-navigation';
import type { SharedData } from '@/types';
import { cn } from '@/lib/utils';
import { Link, router, usePage } from '@inertiajs/react';
import axios from 'axios';
import { programHeadHelp, programHeadNotifications } from '@/routes';
import {
    ArrowRight,
    Bell,
    BookOpen,
    CheckCircle2,
    ChevronDown,
    FileText,
    HelpCircle,
    LifeBuoy,
    Mail,
    Menu,
    QrCode,
    Shield,
    Users,
    X,
} from 'lucide-react';
import { useState, useEffect, useRef } from 'react';
import { useNotifications } from '@/hooks/useNotifications';
import NotificationPopup from '@/components/notifications/NotificationPopup';
import { playNotificationSound } from '@/services/notification-sound';

export function ProgramHeadHeader() {
    const page = usePage<SharedData>();
    const { auth } = page.props;
    const getInitials = useInitials();
    const [locallyRead, setLocallyRead] = useState<string[]>([]);
    const [bellClicked, setBellClicked] = useState(false);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [helpOpen, setHelpOpen] = useState(false);

    // Real-time notification hook powered by Node.js + Socket.IO
    const {
        notifications: realtimeList,
        unreadCount: realtimeUnread,
        popupNotification,
        markAsRead: rtMarkAsRead,
        markAllAsRead: rtMarkAllAsRead,
        clearPopup,
    } = useNotifications({
        userId: auth?.user?.id,
        role: 'program_head',
        autoConnect: Boolean(auth?.user?.id),
    });

    const recentNotifications = Array.isArray(
        (page.props as any)?.recentNotifications,
    )
        ? ((page.props as any).recentNotifications ?? [])
        : [];

    const serverNotifications = recentNotifications as Array<{
        id: string | number;
        type?: string;
        title: string;
        subtitle?: string;
        message?: string;
        timeAgo?: string;
        created_at?: string;
        is_read?: boolean;
        slipId?: number | string;
        incidentId?: number | string;
        eventId?: number | string;
    }>;

    const notificationsToRender = (realtimeList.length > 0 ? realtimeList : serverNotifications) as Array<{
        id: string | number;
        type?: string;
        title: string;
        subtitle?: string;
        message?: string;
        timeAgo?: string;
        created_at?: string;
        is_read?: boolean;
        slipId?: number | string;
        incidentId?: number | string;
        eventId?: number | string;
    }>;

    const unreadNotifications = realtimeList.length > 0
        ? realtimeUnread
        : (bellClicked
            ? 0
            : serverNotifications.filter(
                  (n) => !n.is_read && !locallyRead.includes(String(n.id)),
              ).length);

    const lastUnreadCount = useRef(unreadNotifications);
    useEffect(() => {
        if (unreadNotifications > lastUnreadCount.current) {
            playNotificationSound();
        }
        lastUnreadCount.current = unreadNotifications;
    }, [unreadNotifications]);

    const handleNotificationBellClick = () => {
        setBellClicked(true);
    };

    const getNotificationHref = (n: any) => {
        if (!n || !n.type) return null;
        if (
            n.type === 'activity_plan_submitted_admin' ||
            n.type === 'activity_plan_status_updated'
        ) {
            return '/program-head/calendar-events';
        }
        if (
            n.type === 'admission_slip_requested' ||
            n.type === 'admission_slip_status_updated'
        ) {
            return '/program-head/students';
        }
        if (
            n.type === 'incident_reported_program_head' ||
            n.type === 'incident_reported_admin'
        ) {
            return '/program-head/violations';
        }
        if (
            n.type === 'student_verification_requested' ||
            n.type === 'student_registered'
        ) {
            return '/program-head/students';
        }
        return null;
    };

    const handleNotificationClick = (n: any) => {
        const isRead = n.is_read || locallyRead.includes(String(n.id));
        if (!isRead) {
            setLocallyRead((prev) => [...prev, String(n.id)]);
            if (typeof n.id === 'number') {
                rtMarkAsRead(n.id);
            } else {
                axios.post(`/notifications/${n.id}/mark-read`).catch(console.error);
            }
        }

        const href = getNotificationHref(n);
        if (href) {
            router.visit(href);
        }
    };

    const handleMarkAllAsRead = () => {
        const allIds = notificationsToRender.map((n) => String(n.id));
        setLocallyRead(allIds);
        rtMarkAllAsRead();
    };

    const propsAny = page.props as unknown as Record<string, any>;
    const user =
        auth?.user ??
        propsAny?.auth?.user ??
        propsAny?.auth?.user?.data ??
        propsAny?.user;
    const defaultUser = { name: 'Admin User', avatar: null };
    const displayUser = user || defaultUser;
    const subtitleLabel = displayUser ? 'Program Head' : undefined;

    return (
        <div className="fixed inset-x-0 top-0 z-50 border-b border-white/5 bg-gradient-to-r from-[#0b2d66] via-[#103875] to-[#1e40af] text-white shadow-md dark:bg-[#0B192C] dark:from-transparent dark:via-transparent dark:to-transparent">
            <div className="flex h-16 w-full items-center px-4 sm:px-6">
                <Link
                    href="/program-head/dashboard"
                    prefetch
                    className="flex items-center gap-2 sm:gap-3 lg:ml-0"
                >
                    {/* Mobile Menu Trigger */}
                    <div className="lg:hidden">
                        <Sheet
                            open={mobileMenuOpen}
                            onOpenChange={setMobileMenuOpen}
                        >
                            <SheetTrigger asChild>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-10 w-10 rounded-xl text-white hover:bg-white/10"
                                >
                                    <Menu className="h-5 w-5" />
                                </Button>
                            </SheetTrigger>
                            <SheetContent
                                side="left"
                                className="w-72 border-r border-slate-200 bg-white p-0 dark:border-white/10 dark:bg-[#0B192C] [&>button]:hidden"
                            >
                                <SheetHeader className="sr-only">
                                    <SheetTitle>Navigation Menu</SheetTitle>
                                    <SheetDescription>
                                        Main navigation menu for accessing
                                        Program Head dashboard features
                                    </SheetDescription>
                                </SheetHeader>
                                <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50 p-5 dark:border-white/10 dark:bg-white/5">
                                    <div className="flex items-center gap-2">
                                        <div className="flex -space-x-2">
                                            <img
                                                src="/images/SRCB.png"
                                                alt="SRCB Logo"
                                                className="h-9 w-9 rounded-full bg-white object-cover ring-2 ring-white"
                                            />
                                            <img
                                                src="/images/DSA.png"
                                                alt="DSA Logo"
                                                className="h-9 w-9 rounded-full bg-white object-cover ring-2 ring-white"
                                            />
                                        </div>
                                        <span className="font-bold text-slate-900 dark:text-white">
                                            DSAMS
                                        </span>
                                    </div>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        onClick={() => setMobileMenuOpen(false)}
                                        className="h-8 w-8 rounded-full text-slate-500 hover:bg-slate-200 dark:text-white dark:hover:bg-white/10"
                                    >
                                        <X className="h-4 w-4" />
                                    </Button>
                                </div>
                                <MobileNavigation />
                            </SheetContent>
                        </Sheet>
                    </div>
                </Link>

                {/* Logo and Title */}
                <Link
                    href="/"
                    prefetch
                    className="flex items-center gap-2 sm:gap-3 lg:ml-0"
                >
                    <div className="flex items-center gap-1 sm:gap-2">
                        <img
                            src="/images/SRCB.png"
                            alt="SRCB Logo"
                            className="h-8 w-8 rounded-full bg-white object-cover sm:h-10 sm:w-10"
                        />
                        <img
                            src="/images/DSA.png"
                            alt="DSA Logo"
                            className="h-8 w-8 rounded-full bg-white object-cover sm:h-10 sm:w-10"
                        />
                    </div>
                    <div className="hidden leading-tight sm:block">
                        <div className="flex flex-wrap items-center gap-1 sm:gap-2">
                            <div className="text-base font-bold tracking-wide sm:text-lg">
                                DSAMS
                            </div>
                            <div className="hidden text-white/50 md:block">
                                /
                            </div>
                            <div className="hidden text-xs font-semibold text-white/90 lg:block">
                                Dean of Student Affairs Management System
                            </div>
                        </div>
                        <div className="hidden text-[10px] font-semibold text-white/80 sm:block sm:text-[11px]">
                            St. Rita's College of Balingasag
                        </div>
                    </div>
                    {/* Mobile-only title */}
                    <div className="leading-tight sm:hidden">
                        <div className="text-base font-bold tracking-wide">
                            DSAMS
                        </div>
                    </div>
                </Link>

                {/* Right side actions */}
                <div className="ml-auto flex items-center gap-2 sm:gap-3">
                    {/* Help Support Guide */}
                    <Dialog open={helpOpen} onOpenChange={setHelpOpen}>
                        <DialogTrigger asChild>
                            <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                className="relative h-9 w-9 rounded-full text-white hover:bg-white/15 hover:text-white sm:h-10 sm:w-10"
                                title="Program Head Help & Support"
                            >
                                <HelpCircle className="h-4 w-4 sm:h-5 sm:w-5" />
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-md overflow-hidden rounded-2xl border border-slate-200 bg-white p-0 text-slate-900 shadow-xl dark:border-white/10 dark:bg-[#0B192C] dark:text-white">
                            <div className="relative overflow-hidden bg-gradient-to-br from-[#0c2d66] to-[#1e40af] px-6 py-8 text-white">
                                <div className="absolute -right-8 -top-8 h-28 w-28 rounded-full bg-white/5 pointer-events-none" />
                                <div className="relative flex items-center gap-3">
                                    <div className="grid h-10 w-10 place-items-center rounded-xl bg-white/10 text-white backdrop-blur-md">
                                        <LifeBuoy className="h-5 w-5" />
                                    </div>
                                    <div>
                                        <DialogTitle className="text-base font-bold">
                                            Program Head Help Guide
                                        </DialogTitle>
                                        <DialogDescription className="text-xs text-blue-200/80">
                                            Quick references and department management support
                                        </DialogDescription>
                                    </div>
                                </div>
                            </div>

                            <div className="p-5 space-y-4">
                                <p className="text-xs leading-relaxed text-slate-500 dark:text-slate-400">
                                    Welcome to the OSAMS Program Head Support. Access student verification workflows, activity telemetry, or open full guides.
                                </p>

                                <div className="grid grid-cols-2 gap-3">
                                    <div className="flex items-start gap-2.5 rounded-xl border border-slate-100 bg-slate-50/50 p-3 dark:border-slate-800 dark:bg-slate-800/40">
                                        <div className="mt-0.5 rounded-lg bg-blue-50 p-1.5 text-blue-600 dark:bg-blue-950/40 dark:text-blue-400">
                                            <Users className="h-3.5 w-3.5" />
                                        </div>
                                        <div>
                                            <h4 className="text-[11px] font-bold text-slate-800 dark:text-white">Roster</h4>
                                            <p className="text-[10px] text-slate-500 dark:text-slate-400 leading-normal mt-0.5">Validate student profiles</p>
                                        </div>
                                    </div>

                                    <div className="flex items-start gap-2.5 rounded-xl border border-slate-100 bg-slate-50/50 p-3 dark:border-slate-800 dark:bg-slate-800/40">
                                        <div className="mt-0.5 rounded-lg bg-emerald-50 p-1.5 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400">
                                            <QrCode className="h-3.5 w-3.5" />
                                        </div>
                                        <div>
                                            <h4 className="text-[11px] font-bold text-slate-800 dark:text-white">Attendance</h4>
                                            <p className="text-[10px] text-slate-500 dark:text-slate-400 leading-normal mt-0.5">Real-time scan monitoring</p>
                                        </div>
                                    </div>

                                    <div className="flex items-start gap-2.5 rounded-xl border border-slate-100 bg-slate-50/50 p-3 dark:border-slate-800 dark:bg-slate-800/40">
                                        <div className="mt-0.5 rounded-lg bg-rose-50 p-1.5 text-rose-600 dark:bg-rose-950/40 dark:text-rose-400">
                                            <Shield className="h-3.5 w-3.5" />
                                        </div>
                                        <div>
                                            <h4 className="text-[11px] font-bold text-slate-800 dark:text-white">Clearance</h4>
                                            <p className="text-[10px] text-slate-500 dark:text-slate-400 leading-normal mt-0.5">Log department infractions</p>
                                        </div>
                                    </div>

                                    <div className="flex items-start gap-2.5 rounded-xl border border-slate-100 bg-slate-50/50 p-3 dark:border-slate-800 dark:bg-slate-800/40">
                                        <div className="mt-0.5 rounded-lg bg-purple-50 p-1.5 text-purple-600 dark:bg-purple-950/40 dark:text-purple-400">
                                            <FileText className="h-3.5 w-3.5" />
                                        </div>
                                        <div>
                                            <h4 className="text-[11px] font-bold text-slate-800 dark:text-white">Reports</h4>
                                            <p className="text-[10px] text-slate-500 dark:text-slate-400 leading-normal mt-0.5">Department statistics & CSV</p>
                                        </div>
                                    </div>
                                </div>

                                <div className="border-t border-slate-100 pt-4 dark:border-slate-800">
                                    <Link
                                        href={programHeadHelp()}
                                        onClick={() => setHelpOpen(false)}
                                        className="flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 py-2.5 text-xs font-bold text-white shadow-md shadow-blue-500/10 transition-all hover:bg-blue-700 hover:shadow-lg"
                                    >
                                        View Full System Guide & Docs
                                        <ArrowRight className="h-3.5 w-3.5" />
                                    </Link>
                                </div>
                            </div>
                        </DialogContent>
                    </Dialog>
                    {/* Notifications */}
                    <DropdownMenu modal={false}>
                        <DropdownMenuTrigger asChild>
                            <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                onClick={handleNotificationBellClick}
                                className="relative h-9 w-9 rounded-full text-white hover:bg-white/15 hover:text-white sm:h-10 sm:w-10"
                            >
                                <Bell className="h-4 w-4 sm:h-5 sm:w-5" />
                                {unreadNotifications > 0 ? (
                                    <span className="absolute -top-1 -right-1 inline-flex h-4 w-4 items-center justify-center rounded-full bg-rose-500 text-[8px] leading-none font-bold text-white sm:h-5 sm:w-5 sm:text-[9px]">
                                        {unreadNotifications > 99
                                            ? '99+'
                                            : unreadNotifications}
                                    </span>
                                ) : null}
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent
                            className="z-[60] w-88 rounded-2xl border border-slate-100 shadow-xl dark:border-slate-800 dark:bg-[#0B192C]"
                            align="end"
                        >
                            <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3 dark:border-slate-800">
                                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                                    Notifications
                                </h3>
                                {unreadNotifications > 0 && (
                                    <button
                                        type="button"
                                        onClick={handleMarkAllAsRead}
                                        className="text-xs font-semibold text-blue-600 transition-colors hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
                                    >
                                        Mark all as read
                                    </button>
                                )}
                            </div>

                            <div className="max-h-80 divide-y divide-slate-100 overflow-y-auto dark:divide-slate-800">
                                {notificationsToRender.length > 0 ? (
                                    notificationsToRender.map((n) => {
                                        const isRead =
                                            n.is_read ||
                                            locallyRead.includes(String(n.id));
                                        const displaySubtitle = n.subtitle || n.message;
                                        const displayTime = n.timeAgo || (n.created_at ? 'Just now' : undefined);
                                        return (
                                            <div
                                                key={n.id}
                                                onClick={() =>
                                                    handleNotificationClick(n)
                                                }
                                                className={cn(
                                                    'group flex cursor-pointer items-start gap-3 px-4 py-3 transition-all',
                                                    isRead
                                                        ? 'bg-transparent opacity-70 hover:bg-slate-50 dark:hover:bg-slate-800/40'
                                                        : 'bg-blue-50/40 hover:bg-blue-50/70 dark:bg-blue-950/10 dark:hover:bg-blue-950/20',
                                                )}
                                            >
                                                <div className="min-w-0 flex-1">
                                                    <p
                                                        className={cn(
                                                            'text-sm transition-colors',
                                                            isRead
                                                                ? 'dark:text-slate-350 font-medium text-slate-700'
                                                                : 'font-bold text-slate-900 group-hover:text-blue-600 dark:text-white dark:group-hover:text-blue-400',
                                                        )}
                                                    >
                                                        {n.title}
                                                    </p>
                                                    {displaySubtitle && (
                                                        <p className="mt-1 text-xs leading-normal text-slate-600 dark:text-slate-400">
                                                            {displaySubtitle}
                                                        </p>
                                                    )}
                                                    {displayTime && (
                                                        <p className="mt-1.5 text-[10px] font-semibold text-slate-400 dark:text-slate-500">
                                                            {displayTime}
                                                        </p>
                                                    )}
                                                </div>
                                            </div>
                                        );
                                    })
                                ) : (
                                    <div className="px-4 py-6 text-center text-xs text-slate-500 dark:text-slate-400">
                                        No new notifications
                                    </div>
                                )}
                            </div>

                            <Link
                                href="/program-head/notifications"
                                className="block border-t border-slate-100 p-3 text-center text-xs font-bold text-blue-600 transition-colors hover:bg-slate-50 dark:border-slate-800 dark:text-blue-400 dark:hover:bg-slate-800/40"
                            >
                                View all notifications
                            </Link>
                        </DropdownMenuContent>
                    </DropdownMenu>

                    {/* User Menu */}
                    <DropdownMenu modal={false}>
                        <DropdownMenuTrigger asChild>
                            <Button
                                variant="ghost"
                                className="h-auto gap-1 rounded-full border border-white/15 bg-white/5 px-1.5 py-1.5 text-white hover:bg-white/15 hover:text-white sm:gap-2 sm:px-2 sm:py-2"
                            >
                                <Avatar className="size-7 overflow-hidden rounded-full sm:size-8">
                                    <AvatarImage
                                        src={displayUser.avatar}
                                        alt={displayUser.name}
                                    />
                                    <AvatarFallback className="rounded-lg bg-white/20 text-xs text-white sm:text-sm">
                                        {getInitials(displayUser.name)}
                                    </AvatarFallback>
                                </Avatar>
                                <div className="hidden text-left leading-tight md:block">
                                    <div className="max-w-32 truncate text-xs font-semibold sm:text-sm">
                                        {displayUser.name}
                                    </div>
                                    {subtitleLabel && (
                                        <div className="hidden text-xs text-white/90 lg:block">
                                            {subtitleLabel}
                                        </div>
                                    )}
                                </div>
                                <ChevronDown className="hidden h-3 w-3 opacity-90 sm:h-4 sm:w-4 md:block" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent className="w-56" align="end">
                            <UserMenuContent user={displayUser} />
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            </div>

            {/* Real-time Notification Popup Toast */}
            <NotificationPopup
                notification={popupNotification}
                onClose={clearPopup}
                onView={(n) => {
                    const href = getNotificationHref(n);
                    if (href) router.visit(href);
                }}
            />
        </div>
    );
}
