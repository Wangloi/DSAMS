import React, { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import {
    Collapsible,
    CollapsibleContent,
} from '@/components/ui/collapsible';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
    Sidebar,
    SidebarContent,
    SidebarHeader,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
    SidebarMenuSub,
    SidebarMenuSubButton,
    SidebarMenuSubItem,
    useSidebar,
} from '@/components/ui/sidebar';
import { SimpleTooltip } from '@/components/ui/tooltip';
import { useAppearance } from '@/hooks/use-appearance';
import { Link, usePage } from '@inertiajs/react';
import {
    Activity,
    Archive,
    BarChart3,
    CalendarDays,
    ChevronDown,
    ClipboardList,
    GraduationCap,
    KeyRound,
    Layers,
    LayoutGrid,
    Moon,
    NotepadText,
    PanelLeftClose,
    PanelLeftOpen,
    ShieldAlert,
    Sun,
    UserCheck,
    UserRoundCog,
    Users,
} from 'lucide-react';

import {
    adminActivityLog,
    adminAdmissionSlip,
    adminAnalytics,
    adminArchive,
    adminAttendance,
    adminDashboard,
    adminEvaluation,
    adminIncidentsViolations,
    adminManageUsers,
    adminReports,
} from '@/routes';
import type { NavItem } from '@/types';

// Admin Events route function
const adminEvents = () => '/admin/events';

const middleNavItems: NavItem[] = [
    {
        title: 'Events',
        href: adminEvents(),
        icon: CalendarDays,
    },
    {
        title: 'Admission slip',
        href: adminAdmissionSlip(),
        icon: ClipboardList,
    },
    {
        title: 'Incidents & Violations',
        href: adminIncidentsViolations(),
        icon: ShieldAlert,
    },
    {
        title: 'Attendance',
        href: adminAttendance(),
        icon: NotepadText,
    },
    {
        title: 'Evaluation',
        href: adminEvaluation(),
        icon: UserRoundCog,
    },
];

const bottomNavItems: NavItem[] = [
    {
        title: 'Analytics',
        href: adminAnalytics(),
        icon: BarChart3,
    },
    {
        title: 'Reports',
        href: adminReports(),
        icon: ClipboardList,
    },
    {
        title: 'Archive',
        href: adminArchive(),
        icon: Archive,
    },
    {
        title: 'Activity Log',
        href: adminActivityLog(),
        icon: Activity,
    },
];

// Toggle button component for sidebar
function SidebarToggle() {
    const { open, toggleSidebar } = useSidebar();

    return (
        <SimpleTooltip
            content={open ? 'Collapse Sidebar' : 'Expand Sidebar'}
            side="right"
        >
            <Button
                variant="ghost"
                size="icon"
                onClick={toggleSidebar}
                className="h-8 w-8 cursor-pointer rounded-md text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-100"
                aria-label={open ? 'Collapse Sidebar' : 'Expand Sidebar'}
            >
                {open ? (
                    <PanelLeftClose className="h-[18px] w-[18px]" />
                ) : (
                    <PanelLeftOpen className="h-[18px] w-[18px]" />
                )}
            </Button>
        </SimpleTooltip>
    );
}

export function AdminSidebar() {
    const { url } = usePage();
    const { state, isMobile } = useSidebar();
    const isCollapsed = state === 'collapsed' && !isMobile;

    const isManageUsersPath = url.startsWith('/admin/manage-users');
    const [isManageUsersOpen, setIsManageUsersOpen] = useState(() => {
        if (typeof window !== 'undefined') {
            const saved = sessionStorage.getItem('dsams_manage_users_open');
            if (saved !== null) {
                return saved === 'true';
            }
        }
        return false;
    });

    const handleOpenChange = (open: boolean) => {
        setIsManageUsersOpen(open);
        if (typeof window !== 'undefined') {
            sessionStorage.setItem('dsams_manage_users_open', String(open));
        }
    };

    const normalizePath = (href: NavItem['href']) => {
        const hrefString =
            typeof href === 'string' ? href : (href as { url?: string })?.url;
        if (!hrefString) return '';
        try {
            return new URL(hrefString, window.location.origin).pathname;
        } catch {
            return hrefString;
        }
    };

    const isItemActive = (href: NavItem['href']) => {
        const path = normalizePath(href);
        if (!path) return false;

        // Special handling for QR scanner page - it should activate the Attendance menu item
        if (url.includes('/admin/qr-scanner')) {
            return path === '/admin/attendance';
        }

        // Standard active state check for all items including Events
        return (
            url === path ||
            url.startsWith(path + '/') ||
            url.startsWith(path + '?')
        );
    };

    const isSubTabActive = (tab: 'users' | 'program-heads' | 'programs' | 'password-resets') => {
        if (!url.startsWith('/admin/manage-users')) return false;
        const search = url.split('?')[1] || '';
        const params = new URLSearchParams(search);
        const currentTab = params.get('tab');

        if (tab === 'users') {
            return !currentTab || currentTab === 'users';
        }
        return currentTab === tab;
    };

    const baseButtonClassName =
        'relative h-10 rounded-lg px-2.5 text-sm font-medium transition-all duration-200 data-[active=true]:bg-blue-600 data-[active=true]:text-white data-[active=true]:shadow-md data-[active=true]:before:absolute data-[active=true]:before:left-0 data-[active=true]:before:top-1.5 data-[active=true]:before:h-7 data-[active=true]:before:w-1 data-[active=true]:before:rounded-r-full data-[active=true]:before:bg-white dark:data-[active=true]:bg-blue-600/20 dark:data-[active=true]:text-blue-400 dark:data-[active=true]:before:bg-blue-400 dark:hover:bg-slate-800 dark:hover:text-white';

    const subItemClassName =
        'h-8.5 rounded-lg px-2 text-xs font-medium text-slate-600 transition-colors hover:bg-slate-100 hover:text-slate-900 data-[active=true]:bg-blue-50 data-[active=true]:font-bold data-[active=true]:text-blue-600 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-white dark:data-[active=true]:bg-blue-950/40 dark:data-[active=true]:text-blue-400';

    return (
        <Sidebar
            collapsible="icon"
            variant="sidebar"
            className={`[&_[data-sidebar=sidebar]]:mt-16 [&_[data-sidebar=sidebar]]:h-[calc(100svh-4rem)] [&_[data-sidebar=sidebar]]:overflow-y-auto [&_[data-sidebar=sidebar]]:border-r [&_[data-sidebar=sidebar]]:border-slate-200 [&_[data-sidebar=sidebar]]:bg-white [&_[data-sidebar=sidebar]]:text-slate-800 [&_[data-sidebar=sidebar]]:shadow-sm dark:[&_[data-sidebar=sidebar]]:border-slate-800 dark:[&_[data-sidebar=sidebar]]:bg-[#0B192C] dark:[&_[data-sidebar=sidebar]]:text-white dark:[&_[data-sidebar=sidebar]]:shadow-lg`}
        >
            <SidebarHeader className="border-b-0 p-0 dark:border-0" />

            <SidebarContent className="pt-4 pb-2">
                <div className="px-2">
                    <div className="flex items-center justify-between px-3 pb-2">
                        <div className="text-[10px] font-bold tracking-wider text-slate-400 uppercase group-data-[collapsible=icon]:hidden dark:text-slate-500">
                            General
                        </div>
                        <SidebarToggle />
                    </div>
                    <SidebarMenu className="gap-1">
                        {/* Dashboard */}
                        <SidebarMenuItem>
                            <SidebarMenuButton
                                asChild
                                tooltip={{ children: 'Dashboard' }}
                                isActive={isItemActive(adminDashboard())}
                                className={`${baseButtonClassName} text-slate-600 dark:text-slate-400`}
                            >
                                <Link
                                    href={adminDashboard()}
                                    prefetch
                                    className="flex items-center gap-2.5"
                                >
                                    <LayoutGrid className="h-[18px] w-[18px] flex-shrink-0" />
                                    <span className="truncate">Dashboard</span>
                                </Link>
                            </SidebarMenuButton>
                        </SidebarMenuItem>

                        {/* Manage Users Dropdown (Floating Menu in Collapsed Mode, Collapsible in Expanded Mode) */}
                        {isCollapsed ? (
                            <SidebarMenuItem>
                                <DropdownMenu>
                                    <SimpleTooltip content="Manage Users" side="right" align="center">
                                        <DropdownMenuTrigger asChild>
                                            <SidebarMenuButton
                                                asChild
                                                isActive={isManageUsersPath}
                                                className={`${baseButtonClassName} text-slate-600 dark:text-slate-400 cursor-pointer`}
                                            >
                                                <button
                                                    type="button"
                                                    className="flex items-center gap-2.5"
                                                >
                                                    <Users className="h-[18px] w-[18px] flex-shrink-0" />
                                                    <span className="truncate">Manage Users</span>
                                                </button>
                                            </SidebarMenuButton>
                                        </DropdownMenuTrigger>
                                    </SimpleTooltip>
                                    <DropdownMenuContent
                                        side="right"
                                        align="start"
                                        sideOffset={10}
                                        className="w-56 p-1.5 shadow-xl border-slate-200 dark:border-slate-800 dark:bg-[#0B192C]"
                                    >
                                        <DropdownMenuLabel className="px-2.5 py-1.5 text-xs font-bold text-slate-500 uppercase tracking-wider dark:text-slate-400">
                                            Manage Users
                                        </DropdownMenuLabel>
                                        <DropdownMenuSeparator className="my-1 bg-slate-100 dark:bg-slate-800" />
                                        <DropdownMenuItem
                                            asChild
                                            className={
                                                isSubTabActive('users')
                                                    ? 'bg-blue-50 text-blue-600 font-bold dark:bg-blue-950/40 dark:text-blue-400'
                                                    : ''
                                            }
                                        >
                                            <Link
                                                href="/admin/manage-users?tab=users"
                                                prefetch
                                                className="flex items-center gap-2.5 px-2.5 py-2 cursor-pointer rounded-md text-sm text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-800"
                                            >
                                                <UserCheck className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                                                <span>Students</span>
                                            </Link>
                                        </DropdownMenuItem>
                                        <DropdownMenuItem
                                            asChild
                                            className={
                                                isSubTabActive('program-heads')
                                                    ? 'bg-blue-50 text-blue-600 font-bold dark:bg-blue-950/40 dark:text-blue-400'
                                                    : ''
                                            }
                                        >
                                            <Link
                                                href="/admin/manage-users?tab=program-heads"
                                                prefetch
                                                className="flex items-center gap-2.5 px-2.5 py-2 cursor-pointer rounded-md text-sm text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-800"
                                            >
                                                <GraduationCap className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
                                                <span>Personnels</span>
                                            </Link>
                                        </DropdownMenuItem>
                                        <DropdownMenuItem
                                            asChild
                                            className={
                                                isSubTabActive('programs')
                                                    ? 'bg-blue-50 text-blue-600 font-bold dark:bg-blue-950/40 dark:text-blue-400'
                                                    : ''
                                            }
                                        >
                                            <Link
                                                href="/admin/manage-users?tab=programs"
                                                prefetch
                                                className="flex items-center gap-2.5 px-2.5 py-2 cursor-pointer rounded-md text-sm text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-800"
                                            >
                                                <Layers className="h-4 w-4 text-cyan-600 dark:text-cyan-400" />
                                                <span>Academic Programs</span>
                                            </Link>
                                        </DropdownMenuItem>
                                        <DropdownMenuItem
                                            asChild
                                            className={
                                                isSubTabActive('password-resets')
                                                    ? 'bg-blue-50 text-blue-600 font-bold dark:bg-blue-950/40 dark:text-blue-400'
                                                    : ''
                                            }
                                        >
                                            <Link
                                                href="/admin/manage-users?tab=password-resets"
                                                prefetch
                                                className="flex items-center gap-2.5 px-2.5 py-2 cursor-pointer rounded-md text-sm text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-800"
                                            >
                                                <KeyRound className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                                                <span>Password Resets</span>
                                            </Link>
                                        </DropdownMenuItem>
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            </SidebarMenuItem>
                        ) : (
                            <Collapsible
                                open={isManageUsersOpen}
                                onOpenChange={handleOpenChange}
                                className="group/collapsible"
                            >
                                <SidebarMenuItem>
                                    <SidebarMenuButton
                                        tooltip={{ children: 'Manage Users' }}
                                        isActive={isManageUsersPath}
                                        onClick={() => handleOpenChange(!isManageUsersOpen)}
                                        className={`${baseButtonClassName} w-full justify-between text-slate-600 dark:text-slate-400 cursor-pointer`}
                                    >
                                        <div className="flex items-center gap-2.5 min-w-0">
                                            <Users className="h-[18px] w-[18px] flex-shrink-0" />
                                            <span className="truncate">Manage Users</span>
                                        </div>
                                        <ChevronDown
                                            className={`h-4 w-4 shrink-0 transition-transform duration-200 group-data-[collapsible=icon]:hidden ${
                                                isManageUsersOpen ? 'rotate-180' : ''
                                            } ${
                                                isManageUsersPath
                                                    ? 'text-white/80 dark:text-blue-300'
                                                    : 'text-slate-400 dark:text-slate-500'
                                            }`}
                                        />
                                    </SidebarMenuButton>
                                    <CollapsibleContent>
                                        <SidebarMenuSub className="my-1 ml-3 border-l-2 border-slate-200 pl-2.5 dark:border-slate-800">
                                            {/* Students Sub-item */}
                                            <SidebarMenuSubItem>
                                                <SidebarMenuSubButton
                                                    asChild
                                                    isActive={isSubTabActive('users')}
                                                    className={subItemClassName}
                                                >
                                                    <Link
                                                        href="/admin/manage-users?tab=users"
                                                        prefetch
                                                        className="flex items-center gap-2"
                                                    >
                                                        <UserCheck className="h-3.5 w-3.5 flex-shrink-0 text-blue-600 dark:text-blue-400" />
                                                        <span>Students</span>
                                                    </Link>
                                                </SidebarMenuSubButton>
                                            </SidebarMenuSubItem>

                                            {/* Personnels Sub-item */}
                                            <SidebarMenuSubItem>
                                                <SidebarMenuSubButton
                                                    asChild
                                                    isActive={isSubTabActive('program-heads')}
                                                    className={subItemClassName}
                                                >
                                                    <Link
                                                        href="/admin/manage-users?tab=program-heads"
                                                        prefetch
                                                        className="flex items-center gap-2"
                                                    >
                                                        <GraduationCap className="h-3.5 w-3.5 flex-shrink-0 text-indigo-600 dark:text-indigo-400" />
                                                        <span>Personnels</span>
                                                    </Link>
                                                </SidebarMenuSubButton>
                                            </SidebarMenuSubItem>

                                            {/* Academic Programs Sub-item */}
                                            <SidebarMenuSubItem>
                                                <SidebarMenuSubButton
                                                    asChild
                                                    isActive={isSubTabActive('programs')}
                                                    className={subItemClassName}
                                                >
                                                    <Link
                                                        href="/admin/manage-users?tab=programs"
                                                        prefetch
                                                        className="flex items-center gap-2"
                                                    >
                                                        <Layers className="h-3.5 w-3.5 flex-shrink-0 text-cyan-600 dark:text-cyan-400" />
                                                        <span>Academic Programs</span>
                                                    </Link>
                                                </SidebarMenuSubButton>
                                            </SidebarMenuSubItem>

                                            {/* Password Resets Sub-item */}
                                            <SidebarMenuSubItem>
                                                <SidebarMenuSubButton
                                                    asChild
                                                    isActive={isSubTabActive('password-resets')}
                                                    className={subItemClassName}
                                                >
                                                    <Link
                                                        href="/admin/manage-users?tab=password-resets"
                                                        prefetch
                                                        className="flex items-center gap-2"
                                                    >
                                                        <KeyRound className="h-3.5 w-3.5 flex-shrink-0 text-amber-600 dark:text-amber-400" />
                                                        <span>Password Resets</span>
                                                    </Link>
                                                </SidebarMenuSubButton>
                                            </SidebarMenuSubItem>
                                        </SidebarMenuSub>
                                    </CollapsibleContent>
                                </SidebarMenuItem>
                            </Collapsible>
                        )}
                    </SidebarMenu>

                    <div className="mt-6 mb-2 px-3 text-[10px] font-bold tracking-wider text-slate-400 uppercase group-data-[collapsible=icon]:hidden dark:text-slate-500">
                        Services & Tools
                    </div>
                    <SidebarMenu className="gap-1">
                        {middleNavItems.map((item) => (
                            <SidebarMenuItem key={item.title}>
                                <SidebarMenuButton
                                    asChild
                                    tooltip={{ children: item.title }}
                                    isActive={isItemActive(item.href)}
                                    className={`${baseButtonClassName} text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400`}
                                >
                                    <Link
                                        href={item.href}
                                        prefetch
                                        className="flex items-center gap-2.5"
                                    >
                                        {item.icon && (
                                            <item.icon className="h-[18px] w-[18px] flex-shrink-0" />
                                        )}
                                        <span className="truncate">
                                            {item.title}
                                        </span>
                                    </Link>
                                </SidebarMenuButton>
                            </SidebarMenuItem>
                        ))}
                    </SidebarMenu>

                    <div className="mt-6 mb-2 px-3 text-[10px] font-bold tracking-wider text-slate-400 uppercase group-data-[collapsible=icon]:hidden dark:text-slate-500">
                        Analytics & Logs
                    </div>
                    <SidebarMenu className="gap-1">
                        {bottomNavItems.map((item) => (
                            <SidebarMenuItem key={item.title}>
                                <SidebarMenuButton
                                    asChild
                                    tooltip={{ children: item.title }}
                                    isActive={isItemActive(item.href)}
                                    className={`${baseButtonClassName} text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400`}
                                >
                                    <Link
                                        href={item.href}
                                        prefetch
                                        className="flex items-center gap-2.5"
                                    >
                                        {item.icon && (
                                            <item.icon className="h-[18px] w-[18px] flex-shrink-0" />
                                        )}
                                        <span className="truncate">
                                            {item.title}
                                        </span>
                                    </Link>
                                </SidebarMenuButton>
                            </SidebarMenuItem>
                        ))}
                    </SidebarMenu>
                </div>
            </SidebarContent>
        </Sidebar>
    );
}
