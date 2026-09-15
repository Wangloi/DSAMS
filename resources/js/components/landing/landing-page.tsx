import { Head } from '@inertiajs/react';
import LandingAbout from './landing-about';
import LandingCta from './landing-cta';
import LandingFeaturesCarousel from './landing-features-carousel';
import LandingFooter from './landing-footer';
import LandingHero, { type LastEventStats } from './landing-hero';
import LandingNavbar from './landing-navbar';

export default function LandingPage({
    canRegister,
    isAuthed,
    lastEventStats,
}: {
    canRegister: boolean;
    isAuthed: boolean;
    lastEventStats?: LastEventStats;
}) {
    return (
        <>
            <Head title="DSAMS" />
            <div className="min-h-screen w-full overflow-x-hidden bg-[#FBFBFB] text-[#000000]">
                <LandingNavbar isAuthed={isAuthed} />
                <div className="w-full overflow-x-hidden pt-16">
                    <LandingHero
                        canRegister={canRegister}
                        lastEventStats={lastEventStats}
                    />
                    <LandingFeaturesCarousel />
                    <LandingAbout />
                    <LandingCta canRegister={canRegister} />
                    <LandingFooter />
                </div>
            </div>
        </>
    );
}
