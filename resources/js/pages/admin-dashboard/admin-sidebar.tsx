import { Link, usePage } from '@inertiajs/react';
import {
    Activity,
    Archive,
    BarChart3,
    CalendarDays,
    ClipboardList,
    LayoutGrid,
    Moon,
    NotepadText,
    PanelLeftClose,
    PanelLeftOpen,
    ShieldAlert,
    Sun,
    UserRoundCog,
    Users,
} from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
    Sidebar,
    SidebarContent,
    SidebarHeader,
    SidebarFooter,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
    useSidebar,
} from '@/components/ui/sidebar';
import { useAppearance } from '@/hooks/use-appearance';

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

const adminNavItems: NavItem[] = [
    {
        title: 'Dashboard',
        href: adminDashboard(),
        icon: LayoutGrid,
    },
    {
        title: 'Manage Users & Programs',
        href: adminManageUsers(),
        icon: Users,
    },
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
    // Items under "Analytics & Logs"
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

// Theme toggle component (matches hooks/use-appearance.tsx)
function ThemeToggle() {
    const { appearance, updateAppearance } = useAppearance();

    return (
        <div className="inline-flex items-center gap-1 rounded-lg bg-neutral-100 p-1 dark:bg-neutral-800">
            <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => updateAppearance('light')}
                className={
                    appearance === 'light'
                        ? 'h-8 w-8 rounded-md bg-white shadow-xs dark:bg-neutral-700 dark:text-neutral-100'
                        : 'h-8 w-8 rounded-md text-neutral-500 hover:bg-neutral-200/60 hover:text-black dark:text-neutral-400 dark:hover:bg-neutral-700/60'
                }
                aria-label="Set appearance to Light"
                title="Light"
            >
                <Sun className="h-4 w-4" />
            </Button>

            <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => updateAppearance('dark')}
                className={
                    appearance === 'dark'
                        ? 'h-8 w-8 rounded-md bg-white shadow-xs dark:bg-neutral-700 dark:text-neutral-100'
                        : 'h-8 w-8 rounded-md text-neutral-500 hover:bg-neutral-200/60 hover:text-black dark:text-neutral-400 dark:hover:bg-neutral-700/60'
                }
                aria-label="Set appearance to Dark"
                title="Dark"
            >
                <Moon className="h-4 w-4" />
            </Button>

            <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => updateAppearance('system')}
                className={
                    appearance === 'system'
                        ? 'h-8 w-8 rounded-md bg-white shadow-xs dark:bg-neutral-700 dark:text-neutral-100'
                        : 'h-8 w-8 rounded-md text-neutral-500 hover:bg-neutral-200/60 hover:text-black dark:text-neutral-400 dark:hover:bg-neutral-700/60'
                }
                aria-label="Set appearance to System"
                title="System"
            >
                <span className="text-[10px] font-semibold">Sys</span>
            </Button>
        </div>
    );
}

// Toggle button component for sidebar
function SidebarToggle() {
    const { open, setOpen, toggleSidebar } = useSidebar();

    return (
        <Button
            variant="ghost"
            size="icon"
            onClick={toggleSidebar}
            className="h-8 w-8 rounded-md text-slate-500 hover:bg-slate-100 hover:text-slate-900 transition-colors dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-100"
            title={open ? "Collapse Sidebar" : "Expand Sidebar"}
        >
            {open ? (
                <PanelLeftClose className="h-[18px] w-[18px]" />
            ) : (
                <PanelLeftOpen className="h-[18px] w-[18px]" />
            )}
        </Button>
    );
}

export function AdminSidebar() {
    const { url } = usePage();

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

    const baseButtonClassName =
        'relative h-10 rounded-lg px-2.5 text-sm font-medium transition-all duration-200 data-[active=true]:bg-blue-600 data-[active=true]:text-white data-[active=true]:shadow-md data-[active=true]:before:absolute data-[active=true]:before:left-0 data-[active=true]:before:top-1.5 data-[active=true]:before:h-7 data-[active=true]:before:w-1 data-[active=true]:before:rounded-r-full data-[active=true]:before:bg-white dark:data-[active=true]:bg-blue-600/20 dark:data-[active=true]:text-blue-400 dark:data-[active=true]:before:bg-blue-400 dark:hover:bg-slate-800 dark:hover:text-white';

    const topNavItems = adminNavItems.slice(0, 2);
    const middleNavItems = adminNavItems.slice(2, 7);
    const bottomNavItems = adminNavItems.slice(7);

    return (
        <Sidebar
            collapsible="icon"
            variant="sidebar"
            className={`
                [&_[data-sidebar=sidebar]]:mt-16
                [&_[data-sidebar=sidebar]]:h-[calc(100svh-4rem)]
                [&_[data-sidebar=sidebar]]:overflow-y-auto
                [&_[data-sidebar=sidebar]]:border-r
                [&_[data-sidebar=sidebar]]:border-slate-200
                [&_[data-sidebar=sidebar]]:bg-white
                [&_[data-sidebar=sidebar]]:text-slate-800
                [&_[data-sidebar=sidebar]]:shadow-sm

                dark:[&_[data-sidebar=sidebar]]:border-slate-800
                dark:[&_[data-sidebar=sidebar]]:bg-[#0B192C]
                dark:[&_[data-sidebar=sidebar]]:text-white
                dark:[&_[data-sidebar=sidebar]]:shadow-lg
            `}
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
                        {topNavItems.map((item) => {
                            const isAttendanceActive =
                                item.title === 'Attendance' &&
                                isItemActive(item.href);

                            return (
                                <SidebarMenuItem key={item.title}>
                                    <SidebarMenuButton
                                        asChild
                                        tooltip={{ children: item.title }}
                                        isActive={
                                            item.title === 'Attendance'
                                                ? isAttendanceActive
                                                : isItemActive(item.href)
                                        }
                                        className={`${baseButtonClassName}
                                            text-slate-600
                                            hover:bg-slate-100
                                            hover:text-slate-900
                                            dark:text-slate-400
                                        `}
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
                            );
                        })}
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

            <SidebarFooter className="border-t border-slate-200 dark:border-slate-800"></SidebarFooter>
        </Sidebar>
    );
}
