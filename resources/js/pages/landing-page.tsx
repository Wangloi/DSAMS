import LandingAbout from '@/components/landing/landing-about';
import LandingCta from '@/components/landing/landing-cta';
import LandingFeaturesCarousel from '@/components/landing/landing-features-carousel';
import LandingFooter from '@/components/landing/landing-footer';
import LandingHero from '@/components/landing/landing-hero';
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
}

export default function LandingPage({ isAuthed, canRegister, stats }: Props) {
  return (
    <div>
      <LandingNavbar isAuthed={isAuthed} />
      <LandingHero canRegister={canRegister} />
      <LandingAbout />
      <LandingFeaturesCarousel />
      <LandingCta canRegister={canRegister} stats={stats} />
      <LandingFooter />
    </div>
  );
}
