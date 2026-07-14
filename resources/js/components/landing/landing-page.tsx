import { Head } from '@inertiajs/react';
import LandingAbout from './landing-about';
import LandingCta from './landing-cta';
import LandingFeaturesCarousel from './landing-features-carousel';
import LandingFooter from './landing-footer';
import LandingHero from './landing-hero';
import LandingNavbar from './landing-navbar';

export default function LandingPage({
  canRegister,
  isAuthed,
}: {
  canRegister: boolean;
  isAuthed: boolean;
}) {
  return (
    <>
      <Head title="DSAMS" />
      <div className="min-h-screen bg-[#FBFBFB] text-[#000000]">
        <LandingNavbar isAuthed={isAuthed} />
        <div className="pt-16">
          <LandingHero canRegister={canRegister} />
          <LandingFeaturesCarousel />
          <LandingAbout />
          <LandingCta canRegister={canRegister} />
          <LandingFooter />
        </div>
      </div>
    </>
  );
}
