import { Head, usePage } from '@inertiajs/react';
import LandingCta from '@/components/landing/landing-cta';
import LandingFooter from '@/components/landing/landing-footer';
import LandingNavbar from '@/components/landing/landing-navbar';
import type { SharedData } from '@/types';

export default function LandingGetStarted() {
    const { auth } = usePage<SharedData>().props;

    return (
        <>
            <Head title="Get Started" />
            <div className="min-h-screen bg-white text-slate-900">
                <LandingNavbar isAuthed={!!auth?.user} />
                <LandingCta />
                <LandingFooter />
            </div>
        </>
    );
}
