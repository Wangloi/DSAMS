import { Link, router, usePage } from '@inertiajs/react';
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
import { cn } from '@/lib/utils';
import { adminAdmissionSlip, adminDashboard, adminNotifications } from '@/routes';
import type { SharedData } from '@/types';
import { MobileNavigation } from './mobile-navigation';
import axios from 'axios';

export function AdminHeader() {
    const page = usePage<SharedData>();
    const { auth } = page.props;
    const getInitials = useInitials();
    const [locallyRead, setLocallyRead] = useState<string[]>([]);
    const [bellClicked, setBellClicked] = useState(false);
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
        is_read?: boolean;
    }>;

    const unreadNotifications = bellClicked ? 0 : notificationsToRender.filter(n => !n.is_read && !locallyRead.includes(n.id)).length;

    const handleNotificationBellClick = () => {
        setBellClicked(true);
    };

    const markSingleAsRead = (id: string, e: React.MouseEvent) => {
        if ((e.target as HTMLElement).closest('a')) return;
        
        const n = notificationsToRender.find(notif => notif.id === id);
        if (n && !n.is_read && !locallyRead.includes(id)) {
            setLocallyRead(prev => [...prev, id]);
            axios.post(`/notifications/${id}/mark-read`).catch(console.error);
        }
    };

    const propsAny = page.props as unknown as Record<string, any>;
    const user = auth?.user ?? propsAny?.auth?.user ?? propsAny?.auth?.user?.data ?? propsAny?.user;
    const defaultUser = { name: 'Admin User', avatar: null };
    const displayUser = user || defaultUser;
    const subtitleLabel = displayUser ? 'Administrator' : undefined;

    return (
        <div className="fixed inset-x-0 top-0 z-50 bg-gradient-to-r from-[#0b2d66] via-[#103875] to-[#1e40af] dark:from-transparent dark:via-transparent dark:to-transparent dark:bg-[#0B192C] text-white border-b border-white/5 shadow-md">
            <div className="flex h-16 w-full items-center px-4 sm:px-6">
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
                                <SheetDescription>Main navigation menu for accessing admin dashboard features</SheetDescription>
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
                                    <span className="font-bold text-slate-900 dark:text-white">OSAMS</span>
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

                {/* Logo and Title */}
                <Link
                    href={adminDashboard()}
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
                            <div className="text-base sm:text-lg font-bold tracking-wide">OSAMS</div>
                            <div className="text-white/50 hidden md:block">/</div>
                            <div className="text-xs font-semibold text-white/90 hidden lg:block">Office of the Student Affairs Management System</div>
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
                                title="Administrator Help & System Guide"
                            >
                                <HelpCircle className="h-4 w-4 sm:h-5 sm:w-5" />
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto rounded-2xl bg-white dark:bg-[#0B192C] text-slate-900 dark:text-white p-6 shadow-xl border border-slate-200 dark:border-white/10">
                            <DialogHeader>
                                <div className="flex items-center gap-3">
                                    <div className="p-2.5 rounded-xl bg-blue-600/10 text-blue-600 dark:bg-blue-400/10 dark:text-blue-400">
                                        <LifeBuoy className="h-6 w-6" />
                                    </div>
                                    <div>
                                        <DialogTitle className="text-lg font-bold">Admin System User Guide</DialogTitle>
                                        <DialogDescription className="text-xs text-slate-500 dark:text-slate-400">
                                            Step-by-step guide on how to use each page in the Admin Dashboard
                                        </DialogDescription>
                                    </div>
                                </div>
                            </DialogHeader>

                            <div className="mt-4 space-y-4 text-sm leading-relaxed">
                                {/* 1. Dashboard Overview */}
                                <div className="rounded-xl bg-slate-50 dark:bg-white/5 p-4 border border-slate-100 dark:border-white/5 space-y-2">
                                    <div className="flex items-center gap-2 font-bold text-blue-700 dark:text-blue-400 text-xs uppercase tracking-wider">
                                        <BookOpen className="h-4 w-4" />
                                        <span>1. Main Dashboard</span>
                                    </div>
                                    <ul className="space-y-1.5 text-xs text-slate-600 dark:text-slate-300">
                                        <li>• <strong>System Stats:</strong> View total registered students, active events, today's attendance rates, and pending user approvals.</li>
                                        <li>• <strong>Quick Action Panel:</strong> Access shortcuts to create new events, register users, or view recent activity logs.</li>
                                    </ul>
                                </div>

                                {/* 2. Attendance & QR Scanner */}
                                <div className="rounded-xl bg-slate-50 dark:bg-white/5 p-4 border border-slate-100 dark:border-white/5 space-y-2">
                                    <div className="flex items-center gap-2 font-bold text-blue-700 dark:text-blue-400 text-xs uppercase tracking-wider">
                                        <CheckCircle2 className="h-4 w-4" />
                                        <span>2. Attendance & QR Scanner</span>
                                    </div>
                                    <ul className="space-y-1.5 text-xs text-slate-600 dark:text-slate-300">
                                        <li>• <strong>Select Event:</strong> Pick an ongoing or upcoming event from the dropdown to start monitoring.</li>
                                        <li>• <strong>Live Camera Scanner:</strong> Click "Start Scanner" to scan student QR codes using your device camera.</li>
                                        <li>• <strong>Activate Portal:</strong> Click "Activate Scanner Portal" to allow assigned student scanners or students to scan via their portal.</li>
                                        <li>• <strong>Geofencing:</strong> Set latitude, longitude, and radius (in meters) to restrict check-ins strictly within venue bounds.</li>
                                    </ul>
                                </div>

                                {/* 3. User Management */}
                                <div className="rounded-xl bg-slate-50 dark:bg-white/5 p-4 border border-slate-100 dark:border-white/5 space-y-2">
                                    <div className="flex items-center gap-2 font-bold text-blue-700 dark:text-blue-400 text-xs uppercase tracking-wider">
                                        <Shield className="h-4 w-4" />
                                        <span>3. Manage Users</span>
                                    </div>
                                    <ul className="space-y-1.5 text-xs text-slate-600 dark:text-slate-300">
                                        <li>• <strong>Approve Students:</strong> Review newly registered students under the "Pending Approvals" tab and approve or reject their accounts.</li>
                                        <li>• <strong>Add / Bulk Import:</strong> Create individual accounts or upload CSV spreadsheets for batch student registration.</li>
                                        <li>• <strong>Program Heads & Admins:</strong> Assign Program Heads to specific departments (e.g., Computer Science, Engineering).</li>
                                    </ul>
                                </div>

                                {/* 4. Events & Evaluations */}
                                <div className="rounded-xl bg-slate-50 dark:bg-white/5 p-4 border border-slate-100 dark:border-white/5 space-y-2">
                                    <div className="flex items-center gap-2 font-bold text-blue-700 dark:text-blue-400 text-xs uppercase tracking-wider">
                                        <BookOpen className="h-4 w-4" />
                                        <span>4. Events & Feedback Evaluations</span>
                                    </div>
                                    <ul className="space-y-1.5 text-xs text-slate-600 dark:text-slate-300">
                                        <li>• <strong>Create Event:</strong> Set event title, date, time-in/out, target courses, and year levels.</li>
                                        <li>• <strong>Feedback Forms:</strong> Create evaluation questionnaires linked to events to collect student feedback ratings & comments.</li>
                                    </ul>
                                </div>

                                {/* 5. Violations & Admission Slips */}
                                <div className="rounded-xl bg-slate-50 dark:bg-white/5 p-4 border border-slate-100 dark:border-white/5 space-y-2">
                                    <div className="flex items-center gap-2 font-bold text-blue-700 dark:text-blue-400 text-xs uppercase tracking-wider">
                                        <Shield className="h-4 w-4" />
                                        <span>5. Incidents, Violations & Admission Slips</span>
                                    </div>
                                    <ul className="space-y-1.5 text-xs text-slate-600 dark:text-slate-300">
                                        <li>• <strong>Record Violation:</strong> Issue disciplinary reports to students for infractions (minor/major).</li>
                                        <li>• <strong>Admission Slips:</strong> Review admission slip requests, approve student returns to class, and print official slips.</li>
                                    </ul>
                                </div>

                                {/* Support Info */}
                                <div className="rounded-xl bg-blue-50 dark:bg-blue-950/40 p-4 border border-blue-100 dark:border-blue-900/40 space-y-1.5">
                                    <div className="flex items-center gap-2 font-semibold text-blue-800 dark:text-blue-300 text-xs">
                                        <Mail className="h-4 w-4" />
                                        <span>System & Technical Support</span>
                                    </div>
                                    <p className="text-xs text-blue-900/80 dark:text-blue-300/80">
                                        For database issues, system configuration, or urgent support, contact the Student Affairs Office at <strong>dsa@srcb.edu.ph</strong>.
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
                        <DropdownMenuContent className="w-80 z-[60]" align="end">
                            <div className="px-4 py-3 border-b border-slate-200">
                                <h3 className="text-sm font-bold text-slate-900">Notifications</h3>
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
                                                "px-4 py-3 border-b border-slate-100 transition-colors group",
                                                isRead
                                                    ? "opacity-60 bg-transparent cursor-default"
                                                    : "cursor-pointer hover:bg-slate-50"
                                            )}
                                        >
                                            <p className={cn(
                                                "text-sm transition-colors",
                                                isRead ? "font-medium text-slate-700" : "font-bold text-slate-900 group-hover:text-blue-600"
                                            )}>{n.title}</p>
                                            {n.subtitle && (
                                                <p className="text-xs text-slate-600 mt-1">{n.subtitle}</p>
                                            )}
                                            {n.timeAgo && (
                                                <p className="text-xs text-slate-500 mt-1">{n.timeAgo}</p>
                                            )}
                                            {n.type === 'admission_slip_requested' && (
                                                <Link
                                                    href={adminAdmissionSlip()}
                                                    className="mt-2 inline-flex rounded-lg bg-[#23509A] px-3 py-1.5 text-[11px] font-semibold text-white hover:bg-[#000D6A] transition-colors"
                                                >
                                                    View Request
                                                </Link>
                                            )}
                                        </div>
                                        );
                                    })
                                ) : (
                                    <div className="px-4 py-8 text-center">
                                        <p className="text-sm text-slate-600">No notifications</p>
                                    </div>
                                )}
                            </div>

                            {notificationsToRender.length > 0 && (
                                <>
                                    <DropdownMenuSeparator className="m-0" />
                                    <Link
                                        href={adminNotifications()}
                                        className="block px-4 py-2 text-sm font-medium text-[#23509A] hover:bg-slate-50 transition-colors"
                                    >
                                        View all
                                    </Link>
                                </>
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
        </div>
    );
}
