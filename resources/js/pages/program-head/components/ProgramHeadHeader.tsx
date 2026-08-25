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
import { Link, usePage } from '@inertiajs/react';
import {
    Bell,
    BookOpen,
    CheckCircle2,
    ChevronDown,
    HelpCircle,
    LifeBuoy,
    Mail,
    Menu,
    X,
} from 'lucide-react';
import { useState } from 'react';

export function ProgramHeadHeader() {
    const page = usePage<SharedData>();
    const { auth } = page.props;
    const getInitials = useInitials();
    const [notificationsRead, setNotificationsRead] = useState(false);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [helpOpen, setHelpOpen] = useState(false);

    const recentNotifications = Array.isArray(
        (page.props as any)?.recentNotifications,
    )
        ? ((page.props as any).recentNotifications ?? [])
        : [];

    const notificationsToRender = recentNotifications as Array<{
        id: string;
        type?: string;
        title: string;
        subtitle?: string;
        timeAgo?: string;
    }>;

    const unreadNotifications = notificationsRead
        ? 0
        : notificationsToRender.length;

    const handleNotificationBellClick = () => {
        setNotificationsRead(true);
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
                                className="w-72 border-r border-slate-200 bg-white p-0 dark:border-white/10 dark:bg-[#0B192C]"
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
                        <DialogContent className="max-w-xl rounded-2xl border border-slate-200 bg-white p-6 text-slate-900 shadow-xl dark:border-white/10 dark:bg-[#0B192C] dark:text-white">
                            <DialogHeader>
                                <div className="flex items-center gap-3">
                                    <div className="rounded-xl bg-blue-600/10 p-2.5 text-blue-600 dark:bg-blue-400/10 dark:text-blue-400">
                                        <LifeBuoy className="h-6 w-6" />
                                    </div>
                                    <div>
                                        <DialogTitle className="text-lg font-bold">
                                            Program Head Help & Guide
                                        </DialogTitle>
                                        <DialogDescription className="text-xs text-slate-500 dark:text-slate-400">
                                            Quick reference and system support
                                            for managing your department
                                        </DialogDescription>
                                    </div>
                                </div>
                            </DialogHeader>

                            <div className="mt-4 space-y-4 text-sm leading-relaxed">
                                <div className="space-y-3 rounded-xl border border-slate-100 bg-slate-50 p-4 dark:border-white/5 dark:bg-white/5">
                                    <div className="flex items-center gap-2 font-semibold text-blue-700 dark:text-blue-400">
                                        <BookOpen className="h-4 w-4" />
                                        <span>Key Features Guide</span>
                                    </div>
                                    <ul className="space-y-2 text-xs text-slate-600 dark:text-slate-300">
                                        <li className="flex items-start gap-2">
                                            <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" />
                                            <span>
                                                <strong>Student Roster:</strong>{' '}
                                                View department student
                                                profiles, statuses, and course
                                                enrollments.
                                            </span>
                                        </li>
                                        <li className="flex items-start gap-2">
                                            <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" />
                                            <span>
                                                <strong>
                                                    Attendance Monitoring:
                                                </strong>{' '}
                                                Track student event check-in/out
                                                records in real time.
                                            </span>
                                        </li>
                                        <li className="flex items-start gap-2">
                                            <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" />
                                            <span>
                                                <strong>
                                                    Violations & Clearance:
                                                </strong>{' '}
                                                Manage student infractions and
                                                sanction resolutions.
                                            </span>
                                        </li>
                                    </ul>
                                </div>

                                <div className="space-y-2 rounded-xl border border-slate-100 bg-slate-50 p-4 dark:border-white/5 dark:bg-white/5">
                                    <div className="flex items-center gap-2 font-semibold text-slate-800 dark:text-slate-200">
                                        <Mail className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                                        <span>Technical Support</span>
                                    </div>
                                    <p className="text-xs text-slate-600 dark:text-slate-400">
                                        Need assistance or account adjustments?
                                        Contact the System Administrator or
                                        Student Affairs Office at{' '}
                                        <strong className="text-blue-600 dark:text-blue-400">
                                            dsa@srcb.edu.ph
                                        </strong>
                                        .
                                    </p>
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
        </div>
    );
}
