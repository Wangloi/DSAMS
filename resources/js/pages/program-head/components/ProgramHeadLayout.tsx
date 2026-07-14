import { AppShell } from '@/components/app-shell';
import { SidebarInset } from '@/components/ui/sidebar';
import { ProgramHeadHeader } from './ProgramHeadHeader';
import { ProgramHeadSidebar } from './ProgramHeadSidebar';
import { AppContent } from '@/components/app-content';
import type { AppLayoutProps } from '@/types';
import { useSidebar } from '@/components/ui/sidebar';

function LayoutContent({ children }: { children: React.ReactNode }) {
  const { open } = useSidebar();
  const decorative = (
    <div className="fixed inset-0 overflow-hidden pointer-events-none">
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-blue-600/10 dark:bg-blue-600/5 rounded-full blur-[120px] mix-blend-multiply dark:mix-blend-soft-light animate-pulse" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-indigo-600/10 dark:bg-indigo-600/5 rounded-full blur-[120px] mix-blend-multiply dark:mix-blend-soft-light" />
      <div className="absolute top-[20%] right-[10%] w-[30%] h-[30%] bg-emerald-600/5 dark:bg-emerald-600/5 rounded-full blur-[100px]" />
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
      <AppContent variant="sidebar" className="overflow-x-hidden pt-16 max-w-full mx-0">
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
