import { Button } from '@/components/ui/button';
import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarHeader,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
    useSidebar,
} from '@/components/ui/sidebar';
import {
    programHeadCalendarEvents as eventManagement,
    programHeadAttendance,
    programHeadDashboard,
    programHeadReports,
    programHeadViolations,
} from '@/routes';

import { Link, usePage } from '@inertiajs/react';
import {
    CalendarDays,
    FileText,
    LayoutGrid,
    PanelLeftClose,
    PanelLeftOpen,
    ShieldAlert,
    Users,
} from 'lucide-react';
import { useMemo } from 'react';

import type { NavItem } from '@/types';

type NavItemWithChildren = NavItem & {
    children?: NavItem[];
};

const programHeadNavItems: NavItemWithChildren[] = [
    {
        title: 'Dashboard',
        href: programHeadDashboard(),
        icon: LayoutGrid,
    },
    {
        title: 'Attendance',
        href: programHeadAttendance(),
        icon: Users,
    },
    {
        title: 'Incidents & Violations',
        href: programHeadViolations(),
        icon: ShieldAlert,
    },
    {
        title: 'Event Management',
        href: eventManagement(),
        icon: CalendarDays,
    },
    {
        title: 'Reports',
        href: programHeadReports(),
        icon: FileText,
    },
];

function SidebarToggle() {
    const { open, toggleSidebar } = useSidebar();

    return (
        <Button
            variant="ghost"
            size="icon"
            onClick={toggleSidebar}
            className="h-8 w-8 rounded-md text-[#0b2d66] transition-colors hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-100"
            title={open ? 'Collapse Sidebar' : 'Expand Sidebar'}
        >
            {open ? (
                <PanelLeftClose className="h-5 w-5" />
            ) : (
                <PanelLeftOpen className="h-5 w-5" />
            )}
        </Button>
    );
}

export function ProgramHeadSidebar() {
    const { url } = usePage();
    const { open } = useSidebar();

    const dashboardPath = useMemo(() => {
        try {
            return new URL(programHeadDashboard(), window.location.origin)
                .pathname;
        } catch {
            return programHeadDashboard();
        }
    }, []);

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

    const isItemActive = (href: NavItem['href'], title?: string) => {
        const path = normalizePath(href);
        if (!path) return false;

        if (path === dashboardPath && title && title !== 'Dashboard') {
            return false;
        }
        return url === path || url.startsWith(path + '/');
    };

    const baseButtonClassName =
        'relative h-10 rounded-lg px-2.5 text-sm font-medium transition-all duration-200 data-[active=true]:bg-blue-600 data-[active=true]:text-white data-[active=true]:shadow-md data-[active=true]:before:absolute data-[active=true]:before:left-0 data-[active=true]:before:top-1.5 data-[active=true]:before:h-7 data-[active=true]:before:w-1 data-[active=true]:before:rounded-r-full data-[active=true]:before:bg-white dark:data-[active=true]:bg-blue-600/20 dark:data-[active=true]:text-blue-400 dark:data-[active=true]:before:bg-blue-400 dark:hover:bg-slate-800 dark:hover:text-white';

    const topNavItems = programHeadNavItems.slice(0, 2);
    const middleNavItems = programHeadNavItems.slice(2);

    return (
        <Sidebar
            collapsible="icon"
            variant="sidebar"
            className={`[&_[data-sidebar=sidebar]]:mt-16 [&_[data-sidebar=sidebar]]:h-[calc(100svh-4rem)] [&_[data-sidebar=sidebar]]:overflow-hidden [&_[data-sidebar=sidebar]]:border-r [&_[data-sidebar=sidebar]]:border-slate-200 [&_[data-sidebar=sidebar]]:bg-white [&_[data-sidebar=sidebar]]:text-slate-800 [&_[data-sidebar=sidebar]]:shadow-sm dark:[&_[data-sidebar=sidebar]]:border-slate-800 dark:[&_[data-sidebar=sidebar]]:bg-[#0B192C] dark:[&_[data-sidebar=sidebar]]:text-white dark:[&_[data-sidebar=sidebar]]:shadow-lg`}
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
                        {topNavItems.map((item) => (
                            <SidebarMenuItem key={item.title}>
                                <SidebarMenuButton
                                    asChild
                                    tooltip={{ children: item.title }}
                                    isActive={isItemActive(
                                        item.href,
                                        item.title,
                                    )}
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
                        Management
                    </div>
                    <SidebarMenu className="gap-1">
                        {middleNavItems.map((item) => (
                            <SidebarMenuItem key={item.title}>
                                <SidebarMenuButton
                                    asChild
                                    tooltip={{ children: item.title }}
                                    isActive={isItemActive(
                                        item.href,
                                        item.title,
                                    )}
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
