import { NavMain } from '@/components/nav-main';
import { NavUser } from '@/components/nav-user';
import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarHeader,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
} from '@/components/ui/sidebar';
import { dashboard } from '@/routes';
import type { NavItem } from '@/types';
import { Link } from '@inertiajs/react';
import {
    Activity,
    Archive,
    ClipboardList,
    LayoutGrid,
    NotepadText,
    ShieldAlert,
    UserRoundCog,
    Users,
} from 'lucide-react';
import AppLogo from './app-logo';

const mainNavItems: NavItem[] = [
    {
        title: 'Dashboard',
        href: dashboard(),
        icon: LayoutGrid,
    },
    {
        title: 'Manage Users',
        href: '#',
        icon: Users,
    },
    {
        title: 'Admission slip',
        href: '/student/admission-slip',
        icon: ClipboardList,
    },

    {
        title: 'Incidents & Violations',
        href: '#',
        icon: ShieldAlert,
    },
    {
        title: 'Attendance',
        href: '#',
        icon: NotepadText,
    },
    {
        title: 'Evaluation',
        href: '#',
        icon: UserRoundCog,
    },
    {
        title: 'Archive',
        href: '#',
        icon: Archive,
    },
    {
        title: 'Activity Log',
        href: '#',
        icon: Activity,
    },
];

export function AppSidebar() {
    return (
        <Sidebar collapsible="icon" variant="inset">
            <SidebarHeader>
                <SidebarMenu>
                    <SidebarMenuItem>
                        <SidebarMenuButton size="lg" asChild>
                            <Link href={dashboard()} prefetch>
                                <AppLogo />
                            </Link>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarHeader>

            <SidebarContent>
                <NavMain items={mainNavItems} />
            </SidebarContent>

            <SidebarFooter>
                <NavUser />
            </SidebarFooter>
        </Sidebar>
    );
}
