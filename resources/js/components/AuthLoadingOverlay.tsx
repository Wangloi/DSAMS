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
    authenticating: 'Authenticating...',
    verifying: 'Verifying session...',
};

export function AuthLoadingOverlay({
    visible,
    state = 'authenticating',
    subtitle = 'Please wait while we securely process your request.',
}: AuthLoadingOverlayProps) {
    useEffect(() => {
        if (visible) {
            Swal.fire({
                title: LABELS[state],
                text: subtitle,
                allowOutsideClick: false,
                allowEscapeKey: false,
                showConfirmButton: false,
                didOpen: () => {
                    Swal.showLoading();
                },
            });
        } else {
            if (Swal.isVisible()) {
                Swal.close();
            }
        }
    }, [visible, state, subtitle]);

    return null;
}
