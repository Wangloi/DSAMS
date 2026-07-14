import { AppContent } from '@/components/app-content';
import { AppShell } from '@/components/app-shell';
import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import type { AppLayoutProps } from '@/types';
import { AdminHeader } from './admin-header';
import { AdminSidebar } from './admin-sidebar';

export default function AdminLayout({
    children,
    breadcrumbs = [],
}: AppLayoutProps) {
    return (
        <SidebarProvider defaultOpen={false}>
            <AdminHeader />
            <AppShell variant="sidebar">
                <AdminSidebar />
                <div className="flex flex-1 flex-col overflow-hidden bg-white dark:bg-[#020617] dark:text-white">
                    <div className="flex items-center gap-2 border-b border-slate-200 bg-slate-50 px-4 py-2 lg:hidden dark:border-slate-800 dark:bg-[#0B192C]">
                        <SidebarTrigger className="h-8 w-8" />
                        <span className="text-sm font-medium text-slate-700 dark:text-slate-200">
                            Menu
                        </span>
                    </div>
                    <AppContent
                        variant="sidebar"
                        className="overflow-x-hidden bg-white pt-0 lg:pt-16 dark:bg-[#020617] dark:text-white"
                    >
                        {children}
                    </AppContent>
                </div>
            </AppShell>
        </SidebarProvider>
    );
}
