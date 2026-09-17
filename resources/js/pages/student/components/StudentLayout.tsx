import { AppShell } from '@/components/app-shell';
import PendingEvaluationsGateModal from '@/components/PendingEvaluationsGateModal';
import type { AppLayoutProps } from '@/types';
import { StudentBottomNavBar } from './StudentBottomNavBar';
import { StudentHeader } from './StudentHeader';
import { StudentPWAInstallBanner } from './StudentPWAInstallBanner';

import { cn } from '@/lib/utils';

interface StudentLayoutProps extends AppLayoutProps {
    hideBottomNav?: boolean;
}

export default function StudentLayout({
    children,
    breadcrumbs = [],
    hideBottomNav = false,
}: StudentLayoutProps) {
    return (
        <AppShell variant="header">
            <StudentHeader />
            <PendingEvaluationsGateModal />
            <div className="relative flex min-h-screen flex-col justify-between overflow-x-hidden bg-slate-50 transition-colors duration-500 dark:bg-[#020617]">
                {/* Visual Depth Layers - Mesh Gradients */}
                <div className="pointer-events-none fixed inset-0 overflow-hidden">
                    <div className="absolute top-[-10%] left-[-10%] h-[50%] w-[50%] animate-pulse rounded-full bg-blue-600/10 mix-blend-multiply blur-[120px] dark:bg-blue-600/5 dark:mix-blend-soft-light" />
                    <div className="absolute right-[-10%] bottom-[-10%] h-[50%] w-[50%] rounded-full bg-indigo-600/10 mix-blend-multiply blur-[120px] dark:bg-indigo-600/5 dark:mix-blend-soft-light" />
                    <div className="absolute top-[20%] right-[10%] h-[30%] w-[30%] rounded-full bg-emerald-600/5 blur-[100px] dark:bg-emerald-600/5" />
                </div>

                <div className="relative z-10 flex-1 pt-20">
                    <div className="mx-auto max-w-7xl px-3 pt-2 sm:px-6 lg:px-8">
                        <StudentPWAInstallBanner />
                    </div>
                    {children}
                </div>
            </div>
            {!hideBottomNav && <StudentBottomNavBar />}
        </AppShell>
    );
}
