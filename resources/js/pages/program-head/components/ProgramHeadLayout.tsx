import { AppContent } from '@/components/app-content';
import { AppShell } from '@/components/app-shell';
import { SidebarInset, useSidebar } from '@/components/ui/sidebar';
import type { AppLayoutProps } from '@/types';
import { ProgramHeadHeader } from './ProgramHeadHeader';
import { ProgramHeadSidebar } from './ProgramHeadSidebar';

function LayoutContent({ children }: { children: React.ReactNode }) {
    const { open } = useSidebar();
    const decorative = (
        <div className="pointer-events-none fixed inset-0 overflow-hidden">
            <div className="absolute top-[-10%] left-[-10%] h-[50%] w-[50%] animate-pulse rounded-full bg-blue-600/10 mix-blend-multiply blur-[120px] dark:bg-blue-600/5 dark:mix-blend-soft-light" />
            <div className="absolute right-[-10%] bottom-[-10%] h-[50%] w-[50%] rounded-full bg-indigo-600/10 mix-blend-multiply blur-[120px] dark:bg-indigo-600/5 dark:mix-blend-soft-light" />
            <div className="absolute top-[20%] right-[10%] h-[30%] w-[30%] rounded-full bg-emerald-600/5 blur-[100px] dark:bg-emerald-600/5" />
        </div>
    );

    return open ? (
        <SidebarInset>
            <ProgramHeadHeader />
            <AppContent variant="sidebar" className="overflow-x-hidden pt-16">
                {decorative}
                <div className="relative z-10">{children}</div>
            </AppContent>
        </SidebarInset>
    ) : (
        <div className="flex flex-1 flex-col overflow-y-auto bg-slate-50 dark:bg-slate-950">
            <ProgramHeadHeader />
            <AppContent
                variant="sidebar"
                className="mx-0 max-w-full overflow-x-hidden pt-16"
            >
                {decorative}
                <div className="relative z-10">{children}</div>
            </AppContent>
        </div>
    );
}

export default function ProgramHeadLayout({
    children,
    breadcrumbs = [],
}: AppLayoutProps) {
    return (
        <AppShell variant="sidebar">
            <ProgramHeadSidebar />
            <LayoutContent>{children}</LayoutContent>
        </AppShell>
    );
}
