import { Bell, BookOpen, CheckCircle2, ChevronDown, HelpCircle, LifeBuoy, Mail, Menu, Shield, X } from 'lucide-react';
import { useState } from 'react';
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
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { UserMenuContent } from '@/components/user-menu-content';
import { useInitials } from '@/hooks/use-initials';
import { MobileNavigation } from '@/pages/admin-dashboard/mobile-navigation';
import type { SharedData } from '@/types';


export function ProgramHeadHeader() {
    const page = usePage<SharedData>();
    const { auth } = page.props;
    const getInitials = useInitials();
    const [notificationsRead, setNotificationsRead] = useState(false);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [helpOpen, setHelpOpen] = useState(false);

    const recentNotifications = Array.isArray((page.props as any)?.recentNotifications)
        ? ((page.props as any).recentNotifications ?? [])
        : [];

    const notificationsToRender = recentNotifications as Array<{
        id: string;
        type?: string;
        title: string;
        subtitle?: string;
        timeAgo?: string;
    }>;

    const unreadNotifications = notificationsRead ? 0 : notificationsToRender.length;

    const handleNotificationBellClick = () => {
        setNotificationsRead(true);
    };

    const propsAny = page.props as unknown as Record<string, any>;
    const user = auth?.user ?? propsAny?.auth?.user ?? propsAny?.auth?.user?.data ?? propsAny?.user;
    const defaultUser = { name: 'Admin User', avatar: null };
    const displayUser = user || defaultUser;
    const subtitleLabel = displayUser ? 'Program Head' : undefined;

    return (
        <div className="fixed inset-x-0 top-0 z-50 bg-gradient-to-r from-[#0b2d66] via-[#103875] to-[#1e40af] dark:from-transparent dark:via-transparent dark:to-transparent dark:bg-[#0B192C] text-white border-b border-white/5 shadow-md">
            <div className="flex h-16 w-full items-center px-4 sm:px-6">
                <Link
                    href="/program-head/dashboard"
                    prefetch
                    className="flex items-center gap-2 sm:gap-3 lg:ml-0"
                >
                    {/* Mobile Menu Trigger */}
                    <div className="lg:hidden">
                        <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
                            <SheetTrigger asChild>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-10 w-10 rounded-xl text-white hover:bg-white/10"
                                >
                                    <Menu className="h-5 w-5" />
                                </Button>
                            </SheetTrigger>
                            <SheetContent side="left" className="w-72 p-0 bg-white dark:bg-[#0B192C] border-r border-slate-200 dark:border-white/10">
                                <SheetHeader className="sr-only">
                                    <SheetTitle>Navigation Menu</SheetTitle>
                                    <SheetDescription>Main navigation menu for accessing Program Head dashboard features</SheetDescription>
                                </SheetHeader>
                                <div className="flex items-center justify-between p-5 border-b border-slate-100 dark:border-white/10 bg-slate-50 dark:bg-white/5">
                                    <div className="flex items-center gap-2">
                                        <div className="flex -space-x-2">
                                            <img
                                                src="/images/SRCB.png"
                                                alt="SRCB Logo"
                                                className="h-9 w-9 rounded-full bg-white ring-2 ring-white object-cover"
                                            />
                                            <img
                                                src="/images/DSA.png"
                                                alt="DSA Logo"
                                                className="h-9 w-9 rounded-full bg-white ring-2 ring-white object-cover"
                                            />
                                        </div>
                                        <span className="font-bold text-slate-900 dark:text-white">DSAMS</span>
                                    </div>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        onClick={() => setMobileMenuOpen(false)}
                                        className="h-8 w-8 rounded-full text-slate-500 dark:text-white hover:bg-slate-200 dark:hover:bg-white/10"
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
                    href='/'
                    prefetch
                    className="flex items-center gap-2 sm:gap-3 lg:ml-0"
                >
                    <div className="flex items-center gap-1 sm:gap-2">
                        <img
                            src="/images/SRCB.png"
                            alt="SRCB Logo"
                            className="h-8 w-8 sm:h-10 sm:w-10 rounded-full bg-white object-cover"
                        />
                        <img
                            src="/images/DSA.png"
                            alt="DSA Logo"
                            className="h-8 w-8 sm:h-10 sm:w-10 rounded-full bg-white object-cover"
                        />
                    </div>
                    <div className="leading-tight hidden sm:block">
                        <div className="flex flex-wrap items-center gap-1 sm:gap-2">
                            <div className="text-base sm:text-lg font-bold tracking-wide">DSAMS</div>
                            <div className="text-white/50 hidden md:block">/</div>
                            <div className="text-xs font-semibold text-white/90 hidden lg:block">Dean of Student Affairs Management System</div>
                        </div>
                        <div className="text-[10px] sm:text-[11px] font-semibold text-white/80 hidden sm:block">St. Rita's College of Balingasag</div>
                    </div>
                    {/* Mobile-only title */}
                    <div className="leading-tight sm:hidden">
                        <div className="text-base font-bold tracking-wide">DSAMS</div>
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
                                className="relative h-9 w-9 sm:h-10 sm:w-10 rounded-full text-white hover:bg-white/15 hover:text-white"
                                title="Program Head Help & Support"
                            >
                                <HelpCircle className="h-4 w-4 sm:h-5 sm:w-5" />
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-xl rounded-2xl bg-white dark:bg-[#0B192C] text-slate-900 dark:text-white p-6 shadow-xl border border-slate-200 dark:border-white/10">
                            <DialogHeader>
                                <div className="flex items-center gap-3">
                                    <div className="p-2.5 rounded-xl bg-blue-600/10 text-blue-600 dark:bg-blue-400/10 dark:text-blue-400">
                                        <LifeBuoy className="h-6 w-6" />
                                    </div>
                                    <div>
                                        <DialogTitle className="text-lg font-bold">Program Head Help & Guide</DialogTitle>
                                        <DialogDescription className="text-xs text-slate-500 dark:text-slate-400">
                                            Quick reference and system support for managing your department
                                        </DialogDescription>
                                    </div>
                                </div>
                            </DialogHeader>

                            <div className="mt-4 space-y-4 text-sm leading-relaxed">
                                <div className="rounded-xl bg-slate-50 dark:bg-white/5 p-4 border border-slate-100 dark:border-white/5 space-y-3">
                                    <div className="flex items-center gap-2 font-semibold text-blue-700 dark:text-blue-400">
                                        <BookOpen className="h-4 w-4" />
                                        <span>Key Features Guide</span>
                                    </div>
                                    <ul className="space-y-2 text-xs text-slate-600 dark:text-slate-300">
                                        <li className="flex items-start gap-2">
                                            <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />
                                            <span><strong>Student Roster:</strong> View department student profiles, statuses, and course enrollments.</span>
                                        </li>
                                        <li className="flex items-start gap-2">
                                            <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />
                                            <span><strong>Attendance Monitoring:</strong> Track student event check-in/out records in real time.</span>
                                        </li>
                                        <li className="flex items-start gap-2">
                                            <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />
                                            <span><strong>Violations & Clearance:</strong> Manage student infractions and sanction resolutions.</span>
                                        </li>
                                    </ul>
                                </div>

                                <div className="rounded-xl bg-slate-50 dark:bg-white/5 p-4 border border-slate-100 dark:border-white/5 space-y-2">
                                    <div className="flex items-center gap-2 font-semibold text-slate-800 dark:text-slate-200">
                                        <Mail className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                                        <span>Technical Support</span>
                                    </div>
                                    <p className="text-xs text-slate-600 dark:text-slate-400">
                                        Need assistance or account adjustments? Contact the System Administrator or Student Affairs Office at <strong className="text-blue-600 dark:text-blue-400">dsa@srcb.edu.ph</strong>.
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
                                className="relative h-9 w-9 sm:h-10 sm:w-10 rounded-full text-white hover:bg-white/15 hover:text-white"
                            >
                                <Bell className="h-4 w-4 sm:h-5 sm:w-5" />
                                {unreadNotifications > 0 ? (
                                    <span className="absolute -right-1 -top-1 inline-flex h-4 w-4 sm:h-5 sm:w-5 items-center justify-center rounded-full bg-rose-500 text-[8px] sm:text-[9px] font-bold leading-none text-white">
                                        {unreadNotifications > 99 ? '99+' : unreadNotifications}
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
        </div>
    );
}
