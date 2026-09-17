export interface BeforeInstallPromptEvent extends Event {
    readonly platforms: string[];
    readonly userChoice: Promise<{
        outcome: 'accepted' | 'dismissed';
        platform: string;
    }>;
    prompt(): Promise<void>;
}

let deferredPrompt: BeforeInstallPromptEvent | null = null;
const installListeners = new Set<(canInstall: boolean) => void>();

export function registerServiceWorker(): void {
    if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
        return;
    }

    window.addEventListener('load', () => {
        navigator.serviceWorker
            .register('/sw.js')
            .then((registration) => {
                // Check for updates periodically
                registration.onupdatefound = () => {
                    const installingWorker = registration.installing;
                    if (installingWorker) {
                        installingWorker.onstatechange = () => {
                            if (
                                installingWorker.state === 'installed' &&
                                navigator.serviceWorker.controller
                            ) {
                                console.log('[PWA] New version available.');
                            }
                        };
                    }
                };
            })
            .catch((error) => {
                console.warn('[PWA] Service Worker registration failed:', error);
            });
    });

    // Capture install prompt event
    window.addEventListener('beforeinstallprompt', (e) => {
        e.preventDefault();
        deferredPrompt = e as BeforeInstallPromptEvent;
        notifyInstallListeners(true);
    });

    window.addEventListener('appinstalled', () => {
        deferredPrompt = null;
        notifyInstallListeners(false);
        console.log('[PWA] DSAMS App successfully installed!');
    });
}

export function subscribeToInstallPrompt(callback: (canInstall: boolean) => void): () => void {
    installListeners.add(callback);
    callback(deferredPrompt !== null);
    return () => installListeners.delete(callback);
}

function notifyInstallListeners(canInstall: boolean) {
    installListeners.forEach((callback) => callback(canInstall));
}

export async function promptPWAInstall(): Promise<'accepted' | 'dismissed' | 'unavailable'> {
    if (!deferredPrompt) {
        return 'unavailable';
    }

    try {
        await deferredPrompt.prompt();
        const choice = await deferredPrompt.userChoice;
        deferredPrompt = null;
        notifyInstallListeners(false);
        return choice.outcome;
    } catch {
        return 'unavailable';
    }
}

export function isAppInstalled(): boolean {
    if (typeof window === 'undefined') return false;

    // Check display-mode standalone (Android / Desktop Chrome)
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches;

    // Check iOS Safari standalone
    const isIosStandalone = Boolean(
        (window.navigator as unknown as { standalone?: boolean }).standalone,
    );

    return isStandalone || isIosStandalone;
}

export function isIosDevice(): boolean {
    if (typeof window === 'undefined') return false;
    const userAgent = window.navigator.userAgent.toLowerCase();
    return /iphone|ipad|ipod/.test(userAgent);
}
