import { AppShell } from '@/components/app-shell';
import type { AppLayoutProps } from '@/types';
import { StudentHeader } from './StudentHeader';

export default function StudentLayout({
    children,
    breadcrumbs = [],
}: AppLayoutProps) {
    return (
        <AppShell variant="header">
            <StudentHeader />
            <div className="relative min-h-screen overflow-x-hidden bg-slate-50 transition-colors duration-500 dark:bg-[#020617]">
                {/* Visual Depth Layers - Mesh Gradients */}
                <div className="pointer-events-none fixed inset-0 overflow-hidden">
                    <div className="absolute top-[-10%] left-[-10%] h-[50%] w-[50%] animate-pulse rounded-full bg-blue-600/10 mix-blend-multiply blur-[120px] dark:bg-blue-600/5 dark:mix-blend-soft-light" />
                    <div className="absolute right-[-10%] bottom-[-10%] h-[50%] w-[50%] rounded-full bg-indigo-600/10 mix-blend-multiply blur-[120px] dark:bg-indigo-600/5 dark:mix-blend-soft-light" />
                    <div className="absolute top-[20%] right-[10%] h-[30%] w-[30%] rounded-full bg-emerald-600/5 blur-[100px] dark:bg-emerald-600/5" />
                </div>

                <div className="relative z-10 pt-20">
                    {children}
                </div>
            </div>
        </AppShell>
    );
}
