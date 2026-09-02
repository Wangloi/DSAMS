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
import { UserMenuContent } from '@/components/user-menu-content';
import { useAppearance } from '@/hooks/use-appearance';
import { useInitials } from '@/hooks/use-initials';
import { cn } from '@/lib/utils';
import {
    studentAttendanceScannerPortal,
    studentDashboard,
    studentEvaluationShow,
    studentNotifications,
    studentHelp,
} from '@/routes';
import type { SharedData } from '@/types';
import { Link, usePage } from '@inertiajs/react';
import axios from 'axios';
import {
    ArrowRight,
    Bell,
    BookOpen,
    ChevronDown,
    FileText,
    HelpCircle,
    LifeBuoy,
    QrCode,
    Shield,
    Users,
} from 'lucide-react';
import { useState } from 'react';

export function StudentHeader() {
    const page = usePage<SharedData>();
    const { auth } = page.props;
    const getInitials = useInitials();
    const { resolvedAppearance, updateAppearance } = useAppearance();
    const [locallyRead, setLocallyRead] = useState<string[]>([]);
    const [bellClicked, setBellClicked] = useState(false);
    const [helpOpen, setHelpOpen] = useState(false);

    const recentNotifications = ((page.props as any)?.recentNotifications ??
        []) as Array<{
        id: string;
        type?: string;
        eventId?: number | string | null;
        evaluationId?: number | string | null;
        title: string;
        subtitle?: string;
        timeAgo?: string;
        is_read?: boolean;
    }>;

    const dashboardNotifications = ((page.props as any)?.notifications ??
        []) as Array<{
        id: string;
        type?: string;
        eventId?: number | string | null;
        evaluationId?: number | string | null;
        title: string;
        subtitle?: string;
        timeAgo?: string;
        is_read?: boolean;
    }>;

    const notificationsToRender =
        recentNotifications.length > 0
            ? recentNotifications
            : dashboardNotifications;
    const unreadNotifications = bellClicked
        ? 0
        : notificationsToRender.filter(
              (n) => !n.is_read && !locallyRead.includes(n.id),
          ).length;

    const handleNotificationBellClick = () => {
        setBellClicked(true);
    };

    const markSingleAsRead = (id: string, e: React.MouseEvent) => {
        // Prevent navigating if it's already read, or if they clicked a link
        if ((e.target as HTMLElement).closest('a')) return;

        const n = notificationsToRender.find((notif) => notif.id === id);
        if (n && !n.is_read && !locallyRead.includes(id)) {
            setLocallyRead((prev) => [...prev, id]);
            axios.post(`/notifications/${id}/mark-read`).catch(console.error);
        }
    };

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
    const subtitleLabel = displayUser ? 'Student' : undefined;

    return (
        <header className="fixed inset-x-0 top-0 z-50 border-b border-white/10 bg-gradient-to-r from-[#0b2d66] via-[#103875] to-[#1e40af] backdrop-blur-xl transition-all duration-300 dark:bg-[#0B192C] dark:from-transparent dark:via-transparent dark:to-transparent">
            <div className="mx-auto flex h-16 w-full max-w-7xl items-center px-4 sm:px-6 lg:px-8">
                <Link
                    href={studentDashboard()}
                    prefetch
                    className="group flex items-center gap-2 sm:gap-3 lg:ml-0"
                >
                    <div className="flex items-center gap-1 sm:gap-2">
                        <img
                            src="/images/SRCB.png"
                            alt="SRCB Logo"
                            className="h-8 w-8 rounded-full bg-white object-cover shadow-sm transition-transform duration-300 group-hover:scale-105 sm:h-10 sm:w-10"
                        />
                        <img
                            src="/images/DSA.png"
                            alt="DSA Logo"
                            className="h-8 w-8 rounded-full bg-white object-cover shadow-sm transition-transform duration-300 group-hover:scale-105 sm:h-10 sm:w-10"
                        />
                    </div>
                    <div className="hidden leading-tight sm:block">
                        <div className="flex flex-wrap items-center gap-1 text-white sm:gap-2">
                            <div className="text-base font-bold tracking-wide sm:text-lg">
                                OSAMS
                            </div>
                            <div className="hidden text-white/50 md:block">
                                /
                            </div>
                            <div className="hidden text-xs font-semibold text-white/90 lg:block">
                                Office of Student Affairs Management System
                            </div>
                        </div>
                        <div className="hidden text-[10px] font-semibold text-white/80 sm:block sm:text-[11px]">
                            St. Rita's College of Balingasag
                        </div>
                    </div>
                    {/* Mobile-only title */}
                    <div className="leading-tight text-white sm:hidden">
                        <div className="text-base font-bold tracking-wide">
                            OSAMS
                        </div>
                    </div>
                </Link>

                <div className="ml-auto flex items-center gap-1 sm:gap-2">
                    {/* Help Support Guide */}
                    <Dialog open={helpOpen} onOpenChange={setHelpOpen}>
                        <DialogTrigger asChild>
                            <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                className="relative h-10 w-10 rounded-xl text-white transition-colors hover:bg-white/10"
                                title="Student Help & Support"
                            >
                                <HelpCircle className="h-5 w-5" />
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-md overflow-hidden rounded-2xl border border-slate-200 bg-white p-0 text-slate-900 shadow-xl dark:border-white/10 dark:bg-[#0B192C] dark:text-white">
                            <div className="relative overflow-hidden bg-gradient-to-br from-[#0b2d66] to-[#1e40af] px-6 py-8 text-white">
                                <div className="absolute -right-8 -top-8 h-28 w-28 rounded-full bg-white/5 pointer-events-none" />
                                <div className="relative flex items-center gap-3">
                                    <div className="grid h-10 w-10 place-items-center rounded-xl bg-white/10 text-white backdrop-blur-md">
                                        <LifeBuoy className="h-5 w-5" />
                                    </div>
                                    <div>
                                        <DialogTitle className="text-base font-bold">
                                            Student Quick Help Guide
                                        </DialogTitle>
                                        <DialogDescription className="text-xs text-blue-200/80">
                                            Access guidelines, scans, and support desk
                                        </DialogDescription>
                                    </div>
                                </div>
                            </div>

                            <div className="p-5 space-y-4">
                                <p className="text-xs leading-relaxed text-slate-500 dark:text-slate-400">
                                    Welcome to Student Help & Support. Get quick help on key system modules or navigate to the full guidelines center for detailed manuals.
                                </p>

                                <div className="grid grid-cols-2 gap-3">
                                    <div className="flex items-start gap-2.5 rounded-xl border border-slate-100 bg-slate-50/50 p-3 dark:border-slate-800 dark:bg-slate-800/40">
                                        <div className="mt-0.5 rounded-lg bg-blue-50 p-1.5 text-blue-600 dark:bg-blue-950/40 dark:text-blue-400">
                                            <QrCode className="h-3.5 w-3.5" />
                                        </div>
                                        <div>
                                            <h4 className="text-[11px] font-bold text-slate-800 dark:text-white">QR Scans</h4>
                                            <p className="text-[10px] text-slate-500 dark:text-slate-400 leading-normal mt-0.5">Check-in at activities</p>
                                        </div>
                                    </div>

                                    <div className="flex items-start gap-2.5 rounded-xl border border-slate-100 bg-slate-50/50 p-3 dark:border-slate-800 dark:bg-slate-800/40">
                                        <div className="mt-0.5 rounded-lg bg-purple-50 p-1.5 text-purple-600 dark:bg-purple-950/40 dark:text-purple-400">
                                            <FileText className="h-3.5 w-3.5" />
                                        </div>
                                        <div>
                                            <h4 className="text-[11px] font-bold text-slate-800 dark:text-white">Surveys</h4>
                                            <p className="text-[10px] text-slate-500 dark:text-slate-400 leading-normal mt-0.5">Submit reviews & feedback</p>
                                        </div>
                                    </div>

                                    <div className="flex items-start gap-2.5 rounded-xl border border-slate-100 bg-slate-50/50 p-3 dark:border-slate-800 dark:bg-slate-800/40">
                                        <div className="mt-0.5 rounded-lg bg-rose-50 p-1.5 text-rose-600 dark:bg-rose-950/40 dark:text-rose-400">
                                            <Shield className="h-3.5 w-3.5" />
                                        </div>
                                        <div>
                                            <h4 className="text-[11px] font-bold text-slate-800 dark:text-white">Clearance</h4>
                                            <p className="text-[10px] text-slate-500 dark:text-slate-400 leading-normal mt-0.5">Sanctions & return slips</p>
                                        </div>
                                    </div>

                                    <div className="flex items-start gap-2.5 rounded-xl border border-slate-100 bg-slate-50/50 p-3 dark:border-slate-800 dark:bg-slate-800/40">
                                        <div className="mt-0.5 rounded-lg bg-amber-50 p-1.5 text-amber-600 dark:bg-amber-950/40 dark:text-amber-400">
                                            <HelpCircle className="h-3.5 w-3.5" />
                                        </div>
                                        <div>
                                            <h4 className="text-[11px] font-bold text-slate-800 dark:text-white">Support</h4>
                                            <p className="text-[10px] text-slate-500 dark:text-slate-400 leading-normal mt-0.5">Contact technical help</p>
                                        </div>
                                    </div>
                                </div>

                                <div className="border-t border-slate-100 pt-4 dark:border-slate-800">
                                    <Link
                                        href={studentHelp()}
                                        onClick={() => setHelpOpen(false)}
                                        className="flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 py-2.5 text-xs font-bold text-white shadow-md shadow-blue-500/10 transition-all hover:bg-blue-700 hover:shadow-lg"
                                    >
                                        View Full Guidelines
                                        <ArrowRight className="h-3.5 w-3.5" />
                                    </Link>
                                </div>
                            </div>
                        </DialogContent>
                    </Dialog>

                    <DropdownMenu modal={false}>
                        <DropdownMenuTrigger asChild>
                            <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                onClick={handleNotificationBellClick}
                                className="relative h-10 w-10 rounded-xl text-white transition-colors hover:bg-white/10"
                            >
                                <Bell className="h-5 w-5" />
                                {unreadNotifications > 0 ? (
                                    <span className="absolute top-2 right-2 inline-flex h-2 w-2 items-center justify-center rounded-full bg-rose-500 ring-2 ring-[#0b2d66] dark:ring-[#051139]">
                                        <span className="absolute inset-0 animate-ping rounded-full bg-rose-500 opacity-75"></span>
                                    </span>
                                ) : null}
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent
                            className="z-[60] w-[88vw] sm:w-80 overflow-hidden rounded-2xl border border-slate-200 bg-white p-0 shadow-2xl dark:border-white/10 dark:bg-[#051139]"
                            align="end"
                        >
                            <div className="border-b border-slate-100 bg-slate-50 px-5 py-4 dark:border-white/10 dark:bg-white/5">
                                <h3 className="text-xs font-black tracking-widest text-slate-500 uppercase dark:text-white/60">
                                    Notifications
                                </h3>
                            </div>

                            <div className="max-h-80 overflow-y-auto">
                                {notificationsToRender.length > 0 ? (
                                    notificationsToRender.map((n) => {
                                        const isRead =
                                            n.is_read ||
                                            locallyRead.includes(n.id);
                                        return (
                                            <div
                                                key={n.id}
                                                onClick={(e) =>
                                                    !isRead &&
                                                    markSingleAsRead(n.id, e)
                                                }
                                                className={cn(
                                                    'group border-b border-slate-50 px-5 py-4 transition-colors dark:border-white/5',
                                                    isRead
                                                        ? 'cursor-default bg-transparent opacity-60'
                                                        : 'cursor-pointer hover:bg-slate-50 dark:hover:bg-white/5',
                                                )}
                                            >
                                                <div className="flex flex-col gap-1">
                                                    <p
                                                        className={cn(
                                                            'text-sm transition-colors',
                                                            isRead
                                                                ? 'font-medium text-slate-700 dark:text-white/70'
                                                                : 'font-bold text-slate-900 group-hover:text-blue-600 dark:text-white dark:group-hover:text-blue-400',
                                                        )}
                                                    >
                                                        {n.title}
                                                    </p>
                                                    {n.subtitle && (
                                                        <p className="text-xs leading-relaxed font-medium text-slate-500 dark:text-white/60">
                                                            {n.subtitle}
                                                        </p>
                                                    )}
                                                    <div className="mt-2 flex items-center justify-between">
                                                        {n.timeAgo && (
                                                            <p className="text-[10px] font-bold tracking-tight text-slate-400 uppercase dark:text-white/40">
                                                                {n.timeAgo}
                                                            </p>
                                                        )}

                                                        {n.type ===
                                                            'scanner_portal_access_granted' &&
                                                            n.eventId && (
                                                                <Link
                                                                    href={studentAttendanceScannerPortal(
                                                                        n.eventId,
                                                                    )}
                                                                    className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-3 py-1.5 text-[10px] font-black tracking-widest text-white uppercase shadow-sm transition-colors hover:bg-blue-700"
                                                                >
                                                                    Open Scanner
                                                                </Link>
                                                            )}
                                                        {n.type ===
                                                            'evaluation_available' &&
                                                            n.evaluationId && (
                                                                <Link
                                                                    href={studentEvaluationShow(
                                                                        n.evaluationId,
                                                                    )}
                                                                    className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-3 py-1.5 text-[10px] font-black tracking-widest text-white uppercase shadow-sm transition-colors hover:bg-blue-700"
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
                                    <div className="flex flex-col items-center gap-3 px-5 py-10 text-center">
                                        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-50 dark:bg-white/5">
                                            <Bell className="h-6 w-6 text-slate-300 dark:text-white/20" />
                                        </div>
                                        <div>
                                            <p className="text-xs font-bold text-slate-600 dark:text-white/80">
                                                All caught up!
                                            </p>
                                            <p className="mx-auto mt-1 max-w-[200px] text-[10px] font-medium text-slate-400 dark:text-white/40">
                                                Updates on events and
                                                evaluations will appear here.
                                            </p>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {notificationsToRender.length > 0 && (
                                <div className="border-t border-slate-100 bg-slate-50/50 p-3 dark:border-white/10 dark:bg-white/5">
                                    <Link
                                        href={studentNotifications()}
                                        className="flex w-full items-center justify-center py-2 text-[10px] font-black tracking-widest text-slate-500 uppercase transition-colors hover:text-blue-600 dark:text-white/60 dark:hover:text-blue-400"
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
        </header>
    );
}
