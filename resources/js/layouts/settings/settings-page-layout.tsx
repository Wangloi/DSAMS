import SettingsLayout from '@/layouts/settings/layout';
import { AdminHeader } from '@/pages/admin-dashboard/admin-header';
import { ProgramHeadHeader } from '@/pages/program-head/components/ProgramHeadHeader';
import { StudentHeader } from '@/pages/student/components/StudentHeader';
import type { Auth, SharedData } from '@/types';
import { Head, Link, usePage } from '@inertiajs/react';
import { ArrowLeft } from 'lucide-react';
import type { PropsWithChildren } from 'react';

type Props = PropsWithChildren<{
    title: string;
}>;

export default function SettingsPageLayout({ children, title }: Props) {
    const page = usePage<SharedData>();
    const auth = page.props.auth as Auth | undefined;
    const guard = auth?.guard;
    const backUrl = auth?.backUrl ?? '/';
    const backLabel = auth?.roleLabel
        ? `Back to ${auth.roleLabel} dashboard`
        : 'Back to dashboard';

    const usesRoleHeader =
        guard === 'student' || guard === 'program_head' || guard === 'admin';

    return (
        <>
            <Head title={title} />

            {guard === 'student' && <StudentHeader />}
            {guard === 'program_head' && <ProgramHeadHeader />}
            {guard === 'admin' && <AdminHeader />}

            <div
                className={
                    usesRoleHeader
                        ? 'min-h-screen bg-slate-100 pt-16 dark:bg-slate-950'
                        : 'min-h-screen bg-slate-100 dark:bg-slate-950'
                }
            >
                {/* Wayfinding: back control (Nielsen — user control & freedom) */}
                <div className="border-b border-slate-200/80 bg-white/90 backdrop-blur-sm dark:border-slate-800 dark:bg-slate-900/90">
                    <div className="mx-auto flex w-full max-w-6xl items-center gap-3 px-4 py-3 sm:px-6 lg:px-8">
                        <Link
                            href={backUrl}
                            className="inline-flex items-center gap-2 rounded-lg px-2 py-1.5 text-sm font-medium text-[#23509A] transition-colors hover:bg-[#23509A]/10 dark:text-blue-300 dark:hover:bg-blue-500/10"
                        >
                            <ArrowLeft
                                className="h-4 w-4 shrink-0"
                                aria-hidden
                            />
                            {backLabel}
                        </Link>
                        {auth?.roleLabel && (
                            <span className="hidden text-xs font-medium text-slate-500 sm:inline dark:text-slate-400">
                                · Signed in as {auth.roleLabel}
                            </span>
                        )}
                    </div>
                </div>

                <SettingsLayout>{children}</SettingsLayout>
            </div>
        </>
    );
}
