import { useEffect } from 'react';
import { createPortal } from 'react-dom';
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
        // If any lingering SweetAlert loading dialog is open, close it cleanly
        if (visible && Swal.isVisible() && Swal.isLoading()) {
            Swal.close();
        }
    }, [visible]);

    if (!visible) return null;

    const overlay = (
        <div
            role="status"
            aria-live="polite"
            className="fixed inset-0 z-[999999] flex items-center justify-center bg-slate-900/50 backdrop-blur-xs transition-opacity duration-200 p-4"
        >
            <div className="w-full max-w-lg rounded-3xl bg-white p-8 sm:p-10 text-center shadow-2xl dark:bg-slate-900 border border-slate-100 dark:border-slate-800 animate-in fade-in zoom-in-95 duration-200">
                <h3 className="text-2xl sm:text-[1.65rem] font-bold tracking-tight text-slate-800 dark:text-white">
                    {LABELS[state] || 'Signing in...'}
                </h3>
                <p className="mt-3 text-sm sm:text-base leading-relaxed text-slate-500 dark:text-slate-400 max-w-md mx-auto font-normal">
                    {subtitle || SUBTITLES[state] || 'Please wait a moment while we securely process your request.'}
                </p>
                <div className="mt-7 flex items-center justify-center">
                    <div
                        className="h-10 w-10 sm:h-11 sm:w-11 rounded-full animate-spin"
                        style={{
                            borderWidth: '3.5px',
                            borderStyle: 'solid',
                            borderColor: '#2563eb transparent #2563eb transparent',
                        }}
                    />
                </div>
            </div>
        </div>
    );

    return typeof document !== 'undefined'
        ? createPortal(overlay, document.body)
        : null;
}

