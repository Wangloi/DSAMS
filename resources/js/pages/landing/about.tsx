import LandingAbout from '@/components/landing/landing-about';
import LandingFooter from '@/components/landing/landing-footer';
import LandingNavbar from '@/components/landing/landing-navbar';
import type { SharedData } from '@/types';
import { Head, usePage } from '@inertiajs/react';

interface Props {
    stats?: {
        totalStudents: number;
        totalEvents: number;
    };
}

export default function LandingAboutPage({ stats }: Props) {
    const { auth } = usePage<SharedData>().props;

    return (
        <>
            <Head title="About" />
            <div className="min-h-screen bg-white text-slate-900">
                <LandingNavbar isAuthed={!!auth?.user} />
                <LandingAbout stats={stats} />
                <LandingFooter />
            </div>
        </>
    );
}
