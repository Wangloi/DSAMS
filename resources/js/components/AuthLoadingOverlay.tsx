import { useEffect } from 'react';
import Swal from 'sweetalert2';

export type AuthLoadingState =
    | 'signing-in'
    | 'signing-out'
    | 'authenticating'
    | 'verifying';

interface AuthLoadingOverlayProps {
    visible: boolean;
    state?: AuthLoadingState;
    subtitle?: string;
}

const LABELS: Record<AuthLoadingState, string> = {
    'signing-in': 'Signing in...',
    'signing-out': 'Signing out...',
    authenticating: 'Checking account...',
    verifying: 'Checking account...',
};

const SUBTITLES: Record<AuthLoadingState, string> = {
    'signing-in': 'Please wait a moment while we securely process your request.',
    'signing-out': 'Please wait a moment while we log you out.',
    authenticating: 'Please wait a moment while we check your login details.',
    verifying: 'Please wait a moment while we verify your access.',
};

export function AuthLoadingOverlay({
    visible,
    state = 'authenticating',
    subtitle,
}: AuthLoadingOverlayProps) {
    useEffect(() => {
        if (visible) {
            Swal.fire({
                title: LABELS[state] || 'Signing in...',
                text: subtitle || SUBTITLES[state] || 'Please wait a moment while we process your request.',
                allowOutsideClick: false,
                allowEscapeKey: false,
                showConfirmButton: false,
                customClass: {
                    popup: 'rounded-2xl p-6 shadow-2xl font-sans',
                    title: 'text-2xl font-black text-[#1b2f8a]',
                    htmlContainer: 'text-sm text-slate-600 font-medium mt-2',
                },
                didOpen: () => {
                    Swal.showLoading();
                },
            });
        } else {
            if (Swal.isVisible() && Swal.isLoading()) {
                Swal.close();
            }
        }

        return () => {
            if (Swal.isVisible() && Swal.isLoading()) {
                Swal.close();
            }
        };
    }, [visible, state, subtitle]);

    return null;
}

