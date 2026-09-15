import LandingAbout from '@/components/landing/landing-about';
import LandingCta from '@/components/landing/landing-cta';
import LandingFeaturesCarousel from '@/components/landing/landing-features-carousel';
import LandingFooter from '@/components/landing/landing-footer';
import LandingHero, { type LastEventStats } from '@/components/landing/landing-hero';
import LandingNavbar from '@/components/landing/landing-navbar';

interface Props {
    isAuthed: boolean;
    canRegister: boolean;
    stats?: {
        totalStudents: number;
        totalEvents: number;
        totalAdmissionSlips: number;
        totalPrograms: number;
    };
    lastEventStats?: LastEventStats;
}

export default function LandingPage({
    isAuthed,
    canRegister,
    stats,
    lastEventStats,
}: Props) {
    return (
        <div className="w-full overflow-x-hidden bg-[#FBFBFB]">
            <LandingNavbar isAuthed={isAuthed} />
            <div className="w-full overflow-x-hidden pt-16">
                <LandingHero
                    canRegister={canRegister}
                    lastEventStats={lastEventStats}
                />
                <LandingAbout stats={stats} />
                <LandingFeaturesCarousel />
                <LandingCta canRegister={canRegister} stats={stats} />
                <LandingFooter />
            </div>
        </div>
    );
}
