import React, { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import {
    isAppInstalled,
    isIosDevice,
    promptPWAInstall,
    subscribeToInstallPrompt,
} from '@/lib/pwa';
import { cn } from '@/lib/utils';
import { Download, Share, Smartphone, Sparkles, X } from 'lucide-react';

const STORAGE_KEY = 'dsams_pwa_banner_dismissed_at';

export function StudentPWAInstallBanner() {
    const [canInstall, setCanInstall] = useState(false);
    const [installed, setInstalled] = useState(true);
    const [dismissed, setDismissed] = useState(true);
    const [isIos, setIsIos] = useState(false);
    const [showIosGuide, setShowIosGuide] = useState(false);

    useEffect(() => {
        const isInstalled = isAppInstalled();
        setInstalled(isInstalled);
        setIsIos(isIosDevice());

        if (isInstalled) return;

        // Check if previously dismissed within the last 5 days
        const dismissedAt = localStorage.getItem(STORAGE_KEY);
        if (dismissedAt) {
            const fiveDaysMs = 5 * 24 * 60 * 60 * 1000;
            if (Date.now() - Number(dismissedAt) < fiveDaysMs) {
                setDismissed(true);
                return;
            }
        }
        setDismissed(false);

        const unsubscribe = subscribeToInstallPrompt((available) => {
            setCanInstall(available);
        });

        return () => unsubscribe();
    }, []);

    const handleDismiss = () => {
        setDismissed(true);
        localStorage.setItem(STORAGE_KEY, String(Date.now()));
    };

    const handleInstallClick = async () => {
        if (canInstall) {
            const result = await promptPWAInstall();
            if (result === 'accepted') {
                setDismissed(true);
            }
        } else if (isIos) {
            setShowIosGuide(true);
        }
    };

    if (installed || dismissed) {
        return null;
    }

    return (
        <div className="relative mb-4 overflow-hidden rounded-2xl border border-blue-500/30 bg-gradient-to-r from-blue-900/90 via-[#0b2d66]/90 to-indigo-950/90 p-4 text-white shadow-xl shadow-blue-950/30 backdrop-blur-xl animate-in fade-in-50 slide-in-from-top-2 duration-300 dark:border-blue-400/20">
            {/* Background Glow */}
            <div className="pointer-events-none absolute -top-10 -right-10 h-32 w-32 rounded-full bg-blue-500/20 blur-2xl" />
            <div className="pointer-events-none absolute -bottom-10 -left-10 h-32 w-32 rounded-full bg-indigo-500/20 blur-2xl" />

            <div className="relative flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-start gap-3.5">
                    <div className="relative flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white/10 p-2 shadow-inner ring-1 ring-white/20 backdrop-blur-md">
                        <img
                            src="/images/DSA.png"
                            alt="DSAMS App Logo"
                            className="h-full w-full object-contain drop-shadow"
                            onError={(e) => {
                                (e.target as HTMLElement).style.display = 'none';
                            }}
                        />
                        <div className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-amber-400 text-[#0B192C]">
                            <Sparkles className="h-2.5 w-2.5" />
                        </div>
                    </div>

                    <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                            <h4 className="text-sm font-black tracking-tight text-white">
                                Install DSAMS Student App
                            </h4>
                            <span className="rounded-md bg-blue-500/30 px-1.5 py-0.5 text-[9px] font-black tracking-widest text-blue-200 uppercase">
                                PWA
                            </span>
                        </div>
                        <p className="mt-0.5 text-xs text-blue-100/80 leading-snug">
                            {isIos
                                ? 'Add to your Home Screen for full-screen app experience and fast access.'
                                : 'Install on your device for instant offline access and campus notifications.'}
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-2 self-end sm:self-center">
                    {isIos && !canInstall ? (
                        <Button
                            type="button"
                            size="sm"
                            onClick={() => setShowIosGuide(!showIosGuide)}
                            className="h-9 gap-1.5 rounded-xl bg-white px-3.5 text-xs font-bold text-[#0b2d66] shadow hover:bg-blue-50 active:scale-95"
                        >
                            <Share className="h-3.5 w-3.5" />
                            <span>{showIosGuide ? 'Hide Steps' : 'How to Install'}</span>
                        </Button>
                    ) : (
                        <Button
                            type="button"
                            size="sm"
                            onClick={handleInstallClick}
                            className="h-9 gap-1.5 rounded-xl bg-gradient-to-r from-blue-500 to-indigo-600 px-4 text-xs font-black text-white shadow-md hover:from-blue-600 hover:to-indigo-700 active:scale-95 cursor-pointer"
                        >
                            <Download className="h-3.5 w-3.5" />
                            <span>Install App</span>
                        </Button>
                    )}

                    <button
                        type="button"
                        onClick={handleDismiss}
                        className="flex h-8 w-8 items-center justify-center rounded-lg text-white/70 transition-colors hover:bg-white/15 hover:text-white"
                        aria-label="Dismiss banner"
                    >
                        <X className="h-4 w-4" />
                    </button>
                </div>
            </div>

            {/* iOS Safari step-by-step instruction panel */}
            {showIosGuide && (
                <div className="mt-3.5 rounded-xl border border-white/10 bg-white/10 p-3 text-xs text-blue-100 backdrop-blur-md animate-in fade-in duration-200">
                    <p className="font-bold text-white mb-1.5">
                        📱 To install on iOS Safari:
                    </p>
                    <ol className="list-decimal list-inside space-y-1 text-[11px] text-blue-100/90 leading-relaxed">
                        <li>
                            Tap the <strong>Share</strong> button (<Share className="inline h-3 w-3 mx-0.5" />) in the Safari bottom bar.
                        </li>
                        <li>
                            Scroll down and tap <strong>Add to Home Screen</strong> (⊕).
                        </li>
                        <li>
                            Tap <strong>Add</strong> at top right to place the DSAMS App on your phone.
                        </li>
                    </ol>
                </div>
            )}
        </div>
    );
}

export default StudentPWAInstallBanner;
