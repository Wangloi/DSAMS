import React, { useCallback, useEffect, useRef, useState } from 'react';
import axios from 'axios';
import { router } from '@inertiajs/react';
import {
    Clock,
    ShieldAlert,
    RefreshCw,
    LogOut,
    CheckCircle2,
    Sliders,
    Info,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';

interface SessionTimeoutModalProps {
    /** Session lifetime in seconds (defaults to 120 min = 7200s or from backend) */
    defaultLifetimeSeconds?: number;
    /** Initial page props from Inertia app setup */
    initialPageProps?: any;
}

const STORAGE_KEY_WARNING_PREF = 'dsams_wcag_session_warning_seconds';

export function SessionTimeoutModal({
    defaultLifetimeSeconds,
    initialPageProps,
}: SessionTimeoutModalProps) {
    const [pageProps, setPageProps] = useState<any>(() => initialPageProps || {});
    const [authData, setAuthData] = useState<{
        authenticated: boolean;
        user: any;
        guard?: string;
    }>(() => {
        const u = initialPageProps?.auth?.user || initialPageProps?.user;
        return {
            authenticated: Boolean(u),
            user: u,
            guard: initialPageProps?.auth?.guard,
        };
    });

    // Synchronize page props when Inertia navigates
    useEffect(() => {
        if (initialPageProps) {
            setPageProps(initialPageProps);
            const u = initialPageProps?.auth?.user || initialPageProps?.user;
            if (u) {
                setAuthData({
                    authenticated: true,
                    user: u,
                    guard: initialPageProps?.auth?.guard,
                });
            }
        }

        const handlePageUpdate = (event: any) => {
            const fresh = event.detail.page?.props as any;
            if (fresh) {
                setPageProps(fresh);
                const u = fresh?.auth?.user || fresh?.user;
                setAuthData({
                    authenticated: Boolean(u),
                    user: u,
                    guard: fresh?.auth?.guard,
                });
            }
        };

        const unbindSuccess = router.on('success', handlePageUpdate);
        const unbindNavigate = router.on('navigate', handlePageUpdate);

        return () => {
            unbindSuccess();
            unbindNavigate();
        };
    }, [initialPageProps]);

    // Check backend status on mount to ensure session truth
    useEffect(() => {
        let mounted = true;
        axios
            .get('/api/session/status')
            .then((res) => {
                if (!mounted) return;
                if (res.data?.authenticated) {
                    setAuthData({
                        authenticated: true,
                        user: res.data.user,
                        guard: res.data.guard,
                    });
                } else {
                    setAuthData({
                        authenticated: false,
                        user: null,
                    });
                }
            })
            .catch(() => {});

        return () => {
            mounted = false;
        };
    }, []);

    const authUser = authData.user || pageProps?.auth?.user || pageProps?.user;

    // Resolve lifetime from page props or fallback (default 120 min in Laravel)
    const backendLifetimeSeconds =
        pageProps?.session?.lifetimeSeconds ||
        (pageProps?.session?.lifetimeMinutes ? pageProps.session.lifetimeMinutes * 60 : 7200);
    const sessionLifetime = defaultLifetimeSeconds || backendLifetimeSeconds;

    // Warning threshold preference (default 120 seconds = 2 minutes, adjustable per WCAG 2.2.1)
    const [warningSeconds, setWarningSeconds] = useState<number>(() => {
        if (typeof window !== 'undefined') {
            const saved = localStorage.getItem(STORAGE_KEY_WARNING_PREF);
            if (saved && !isNaN(Number(saved))) {
                return Number(saved);
            }
        }
        return pageProps?.session?.warningThresholdSeconds || 120;
    });

    // Timing state
    const [isOpen, setIsOpen] = useState(false);
    const [remainingSeconds, setRemainingSeconds] = useState<number>(120);
    const [extensionCount, setExtensionCount] = useState<number>(0);
    const [isExtending, setIsExtending] = useState<boolean>(false);
    const [showTimingAdjuster, setShowTimingAdjuster] = useState<boolean>(false);
    const [statusAnnouncement, setStatusAnnouncement] = useState<string>('');

    // Activity tracking timestamp
    const lastActivityRef = useRef<number>(Date.now());
    const stayLoggedInBtnRef = useRef<HTMLButtonElement>(null);
    const intervalRef = useRef<any>(null);

    // Save user warning preference
    const handleSaveWarningPref = (seconds: number) => {
        setWarningSeconds(seconds);
        if (typeof window !== 'undefined') {
            localStorage.setItem(STORAGE_KEY_WARNING_PREF, String(seconds));
        }
        setStatusAnnouncement(`Warning timing updated to ${Math.round(seconds / 60)} minutes before expiration.`);
    };

    // User activity listener to keep track of active usage
    const registerUserActivity = useCallback(() => {
        lastActivityRef.current = Date.now();
    }, []);

    useEffect(() => {
        if (!authUser) return;

        const events = ['mousedown', 'keydown', 'touchstart', 'scroll', 'click'];
        const handleActivity = () => {
            // Only update activity if modal is not currently showing
            if (!isOpen) {
                registerUserActivity();
            }
        };

        events.forEach((ev) => window.addEventListener(ev, handleActivity, { passive: true }));

        return () => {
            events.forEach((ev) => window.removeEventListener(ev, handleActivity));
        };
    }, [authUser, isOpen, registerUserActivity]);

    // Extend session handler (WCAG 2.2.1: Simple action like pressing space/enter or clicking button)
    const handleExtendSession = useCallback(async () => {
        if (isExtending) return;
        setIsExtending(true);

        try {
            await axios.post('/api/session/extend', {}, {
                headers: {
                    'X-Requested-With': 'XMLHttpRequest',
                },
            });

            lastActivityRef.current = Date.now();
            setExtensionCount((prev) => prev + 1);
            setIsOpen(false);
            setStatusAnnouncement('Session extended successfully. You remain securely logged in.');
        } catch (error) {
            console.error('[WCAG 2.2.1] Failed to extend session:', error);
            // If extending fails due to already being logged out, redirect cleanly
            window.location.href = '/login?expired=1';
        } finally {
            setIsExtending(false);
        }
    }, [isExtending]);

    // Handle logout action
    const handleLogout = useCallback(() => {
        setIsOpen(false);
        const logoutUrl = pageProps?.auth?.logoutUrl || '/logout';
        router.post(logoutUrl, {}, {
            onFinish: () => {
                window.location.href = '/login';
            },
        });
    }, [pageProps?.auth?.logoutUrl]);

    // Main timer checking inactivity and triggering warning dialog
    useEffect(() => {
        if (!authUser) return;

        intervalRef.current = setInterval(() => {
            const idleMs = Date.now() - lastActivityRef.current;
            const idleSeconds = Math.floor(idleMs / 1000);
            const timeLeft = Math.max(0, sessionLifetime - idleSeconds);

            // Trigger warning dialog when time left is less than warning threshold
            if (timeLeft <= warningSeconds && timeLeft > 0) {
                setRemainingSeconds(timeLeft);
                if (!isOpen) {
                    setIsOpen(true);
                    setStatusAnnouncement(
                        `Warning: Your session will expire in ${timeLeft} seconds due to inactivity. Press space or click Extend Session to remain logged in.`
                    );
                }
            } else if (timeLeft <= 0) {
                // Session expired
                clearInterval(intervalRef.current);
                setIsOpen(false);
                window.location.href = '/login?expired=1';
            } else if (isOpen) {
                // If user somehow became active elsewhere, close modal
                setIsOpen(false);
            }
        }, 1000);

        return () => {
            if (intervalRef.current) clearInterval(intervalRef.current);
        };
    }, [authUser, sessionLifetime, warningSeconds, isOpen]);

    // Keyboard accessibility: Allow Spacebar or Enter to immediately extend session
    useEffect(() => {
        if (!isOpen) return;

        // Auto-focus the primary "Stay Logged In" button for keyboard and screen-reader users
        const focusTimer = setTimeout(() => {
            stayLoggedInBtnRef.current?.focus();
        }, 100);

        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === ' ' || e.key === 'Spacebar' || e.key === 'Enter') {
                // Prevent scrolling when pressing space inside dialog
                e.preventDefault();
                void handleExtendSession();
            }
        };

        window.addEventListener('keydown', handleKeyDown);

        return () => {
            clearTimeout(focusTimer);
            window.removeEventListener('keydown', handleKeyDown);
        };
    }, [isOpen, handleExtendSession]);

    // Format minutes and seconds
    const minutes = Math.floor(remainingSeconds / 60);
    const seconds = remainingSeconds % 60;
    const formattedCountdown = `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;

    if (!authUser) {
        return null;
    }

    return (
        <>
            {/* Hidden live region for accessibility screen readers */}
            <div
                role="status"
                aria-live="assertive"
                aria-atomic="true"
                className="sr-only"
            >
                {statusAnnouncement}
            </div>

            <Dialog open={isOpen} onOpenChange={() => {}}>
                <DialogContent
                    role="alertdialog"
                    aria-modal="true"
                    aria-labelledby="session-timeout-title"
                    aria-describedby="session-timeout-desc"
                    size="sm"
                    preventClose={true}
                    className="border-amber-300/80 bg-white shadow-2xl dark:border-amber-700/60 dark:bg-slate-900"
                >
                    <DialogHeader className="space-y-3">
                        <div className="flex items-center gap-3">
                            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-100 text-amber-700 dark:bg-amber-950/80 dark:text-amber-400">
                                <Clock className="h-6 w-6 animate-pulse" aria-hidden="true" />
                            </div>
                            <div>
                                <DialogTitle
                                    id="session-timeout-title"
                                    className="text-lg font-bold text-slate-900 dark:text-white"
                                >
                                    Session Timeout Warning
                                </DialogTitle>
                                <p className="text-xs font-medium text-amber-600 dark:text-amber-400">
                                    WCAG 2.2.1 Timing Adjustable Protected
                                </p>
                            </div>
                        </div>

                        <DialogDescription
                            id="session-timeout-desc"
                            className="text-sm leading-relaxed text-slate-600 dark:text-slate-300"
                        >
                            You have been inactive for a while. To protect your data and security, your authenticated session will expire in:
                        </DialogDescription>
                    </DialogHeader>

                    {/* Prominent High-Contrast Visual & Assistive Countdown */}
                    <div className="my-2 flex flex-col items-center justify-center rounded-2xl border border-amber-200/80 bg-amber-50/60 p-4 dark:border-amber-900/40 dark:bg-amber-950/20">
                        <span
                            className="font-mono text-4xl font-extrabold tracking-tight text-amber-700 dark:text-amber-400"
                            aria-label={`${minutes} minutes and ${seconds} seconds remaining`}
                        >
                            {formattedCountdown}
                        </span>
                        <span className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                            Press <kbd className="rounded border border-slate-300 bg-white px-1.5 py-0.5 text-[11px] font-semibold text-slate-700 shadow-sm dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200">Space</kbd> or <kbd className="rounded border border-slate-300 bg-white px-1.5 py-0.5 text-[11px] font-semibold text-slate-700 shadow-sm dark:border-slate-700 dark:bg-slate-200">Enter</kbd> to stay logged in
                        </span>
                    </div>

                    {/* WCAG Timing Adjuster Toggle */}
                    <div className="space-y-2">
                        <button
                            type="button"
                            onClick={() => setShowTimingAdjuster(!showTimingAdjuster)}
                            className="flex items-center gap-1.5 text-xs font-semibold text-blue-600 transition-colors hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
                            aria-expanded={showTimingAdjuster}
                        >
                            <Sliders className="h-3.5 w-3.5" aria-hidden="true" />
                            {showTimingAdjuster ? 'Hide Timing Preferences' : 'Adjust Timeout Warning Time (WCAG 2.2.1)'}
                        </button>

                        {showTimingAdjuster && (
                            <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs dark:border-slate-800 dark:bg-slate-950/60">
                                <label
                                    htmlFor="timing-pref-select"
                                    className="mb-1 block font-semibold text-slate-700 dark:text-slate-300"
                                >
                                    Warn me before session expires:
                                </label>
                                <select
                                    id="timing-pref-select"
                                    value={warningSeconds}
                                    onChange={(e) => handleSaveWarningPref(Number(e.target.value))}
                                    className="w-full rounded-lg border border-slate-300 bg-white p-2 text-xs text-slate-800 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
                                >
                                    <option value={60}>1 Minute Before Expiry</option>
                                    <option value={120}>2 Minutes Before Expiry (Recommended)</option>
                                    <option value={300}>5 Minutes Before Expiry</option>
                                    <option value={600}>10 Minutes Before Expiry</option>
                                </select>
                                <p className="mt-1.5 text-[11px] text-slate-500 dark:text-slate-400">
                                    Extensions used this session: <strong>{extensionCount}</strong> (unlimited extensions permitted).
                                </p>
                            </div>
                        )}
                    </div>

                    {/* Essential Security & Real-Time Exceptions Disclosure */}
                    <div className="flex items-start gap-2 rounded-lg bg-slate-100/70 p-2.5 text-[11px] text-slate-500 dark:bg-slate-800/50 dark:text-slate-400">
                        <Info className="mt-0.5 h-3.5 w-3.5 flex-shrink-0 text-slate-400" aria-hidden="true" />
                        <span>
                            <strong>Note:</strong> Real-time campus event schedules and the 30-second dynamic rotating attendance QR token are essential security requirements (WCAG 2.2.1 Exceptions 4 & 5) and cannot be indefinitely suspended.
                        </span>
                    </div>

                    <DialogFooter className="mt-3 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={handleLogout}
                            className="w-full text-slate-700 sm:w-auto dark:text-slate-300"
                        >
                            <LogOut className="mr-1.5 h-4 w-4" aria-hidden="true" />
                            Log Out Now
                        </Button>
                        <Button
                            ref={stayLoggedInBtnRef}
                            type="button"
                            onClick={handleExtendSession}
                            disabled={isExtending}
                            className="w-full bg-[#0b2d66] text-white hover:bg-[#08224d] sm:w-auto dark:bg-blue-600 dark:hover:bg-blue-700"
                        >
                            {isExtending ? (
                                <>
                                    <RefreshCw className="mr-1.5 h-4 w-4 animate-spin" aria-hidden="true" />
                                    Extending Session…
                                </>
                            ) : (
                                <>
                                    <CheckCircle2 className="mr-1.5 h-4 w-4" aria-hidden="true" />
                                    Stay Logged In
                                </>
                            )}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
}
export default SessionTimeoutModal;
