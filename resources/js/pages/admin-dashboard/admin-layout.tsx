import { AppContent } from '@/components/app-content';
import { AppShell } from '@/components/app-shell';
import { SidebarProvider } from '@/components/ui/sidebar';
import type { AppLayoutProps } from '@/types';
import { AdminHeader } from './admin-header';
import { AdminSidebar } from './admin-sidebar';
import { AdminBottomNavBar } from './admin-bottom-nav';

export default function AdminLayout({
    children,
    breadcrumbs = [],
}: AppLayoutProps) {
    return (
        <SidebarProvider defaultOpen={false}>
            <AdminHeader />
            <AppShell variant="sidebar">
                {/* Desktop Sidebar: Only visible on lg screens and up */}
                <div className="hidden lg:block">
                    <AdminSidebar />
                </div>

                <div className="flex flex-1 flex-col overflow-hidden bg-white dark:bg-[#020617] dark:text-white">
                    <AppContent
                        variant="sidebar"
                        className="overflow-x-hidden bg-white pt-16 pb-24 lg:pb-8 dark:bg-[#020617] dark:text-white"
                    >
                        {children}
                    </AppContent>
                </div>
            </AppShell>

            {/* Mobile Bottom Navigation Bar for rapid thumb access */}
            <AdminBottomNavBar />
        </SidebarProvider>
    );
}
