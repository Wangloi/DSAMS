
import { Head, usePage } from '@inertiajs/react';
import LandingHelp from '@/components/landing/landing-help';
import LandingFooter from '@/components/landing/landing-footer';
import LandingNavbar from '@/components/landing/landing-navbar';
import type { SharedData } from '@/types';

export default function HelpPage() {
    const { auth } = usePage<SharedData>().props;

    return (
        <>
            <Head title="Help & Documentation" />
            <div className="min-h-screen bg-white text-slate-900">
                <LandingNavbar isAuthed={!!auth?.user} />
                <LandingHelp />
                <LandingFooter />
            </div>
        </>
    );
}
