import { useEffect, useRef, useState } from 'react';

// ─── Types ──────────────────────────────────────────────────────────────────

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

// ─── Label map ───────────────────────────────────────────────────────────────

const LABELS: Record<AuthLoadingState, string> = {
    'signing-in': 'Signing in...',
    'signing-out': 'Signing out...',
    'authenticating': 'Authenticating...',
    'verifying': 'Verifying session...',
};

// ─── Component ───────────────────────────────────────────────────────────────

export function AuthLoadingOverlay({
    visible,
    state = 'authenticating',
    subtitle = 'Please wait while we securely process your request.',
}: AuthLoadingOverlayProps) {
    // We keep the DOM node alive for a short exit animation after `visible` goes false.
    const [rendered, setRendered] = useState(visible);
    const [opacity, setOpacity] = useState(0);
    const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    useEffect(() => {
        if (visible) {
            setRendered(true);
            // Micro-delay so the CSS transition fires after mount.
            timerRef.current = setTimeout(() => setOpacity(1), 10);
        } else {
            setOpacity(0);
            timerRef.current = setTimeout(() => setRendered(false), 300);
        }
        return () => { if (timerRef.current) clearTimeout(timerRef.current); };
    }, [visible]);

    if (!rendered) return null;

    return (
        <div
            aria-live="assertive"
            aria-label={LABELS[state]}
            style={{
                opacity,
                transition: 'opacity 250ms ease',
            }}
            className={[
                'fixed inset-0 z-[9999]',
                'flex items-center justify-center',
                'bg-white/60 dark:bg-slate-950/70',
                'backdrop-blur-sm',
                // Prevent all pointer events from reaching the page beneath.
                'pointer-events-auto',
            ].join(' ')}
        >
            <div
                className={[
                    'flex flex-col items-center gap-5',
                    'w-[min(92vw,460px)]',
                    'rounded-3xl px-10 py-12',
                    'bg-white dark:bg-slate-900',
                    'shadow-[0_8px_40px_rgba(0,0,0,0.12)] dark:shadow-[0_8px_40px_rgba(0,0,0,0.45)]',
                    'border border-slate-100 dark:border-slate-800',
                ].join(' ')}
                role="status"
            >
                {/* Animated spinner */}
                <Spinner />

                {/* Title */}
                <div className="space-y-1 text-center">
                    <p className="text-[15px] font-semibold tracking-tight text-slate-900 dark:text-white">
                        {LABELS[state]}
                    </p>
                    {subtitle && (
                        <p className="text-[12px] leading-relaxed text-slate-500 dark:text-slate-400">
                            {subtitle}
                        </p>
                    )}
                </div>
            </div>
        </div>
    );
}

// ─── Spinner ─────────────────────────────────────────────────────────────────

function Spinner() {
    return (
        <div className="relative h-20 w-20" aria-hidden="true">
            {/* Outer slow ring */}
            <span
                className="absolute inset-0 rounded-full border-[4px] border-blue-100 dark:border-slate-700"
            />
            {/* Spinning arc */}
            <span
                className="absolute inset-0 rounded-full border-[4px] border-transparent border-t-blue-600 dark:border-t-blue-400"
                style={{ animation: 'auth-spin 0.8s linear infinite' }}
            />
            {/* Center dot */}
            <span className="absolute inset-0 flex items-center justify-center">
                <span className="h-4 w-4 rounded-full bg-blue-600 dark:bg-blue-400" />
            </span>

            {/* Inline keyframes (only added once to the document) */}
            <style>{`
                @keyframes auth-spin {
                    to { transform: rotate(360deg); }
                }
            `}</style>
        </div>
    );
}
