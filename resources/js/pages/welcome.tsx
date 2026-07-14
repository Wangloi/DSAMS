import { usePage } from '@inertiajs/react';
import LandingPage from '@/components/landing/landing-page';
import type { SharedData } from '@/types';

export default function Welcome({
  canRegister = true,
}: {
  canRegister?: boolean;
}) {
  const { auth } = usePage<SharedData>().props;

  return <LandingPage canRegister={canRegister} isAuthed={!!auth?.user} />;
}
