import LandingPage from '@/components/landing/landing-page';
import type { SharedData } from '@/types';
import { usePage } from '@inertiajs/react';

export default function Welcome({
    canRegister = true,
}: {
    canRegister?: boolean;
}) {
    const { auth } = usePage<SharedData>().props;

    return <LandingPage canRegister={canRegister} isAuthed={!!auth?.user} />;
}
