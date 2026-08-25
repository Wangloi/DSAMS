import { createInertiaApp, router } from '@inertiajs/react';
import { configureEcho } from '@laravel/echo-react';
import axios from 'axios';
import { resolvePageComponent } from 'laravel-vite-plugin/inertia-helpers';
import { StrictMode, useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import '../css/app.css';
import { AuthLoadingOverlay } from './components/AuthLoadingOverlay';
import { initializeTheme } from './hooks/use-appearance';

// Configure axios with CSRF token for all requests
// Laravel sets an XSRF-TOKEN cookie; axios reads it automatically as X-XSRF-TOKEN
axios.defaults.withCredentials = true;
axios.defaults.withXSRFToken = true;
axios.defaults.headers.common['X-Requested-With'] = 'XMLHttpRequest';

const isHttps =
    typeof window !== 'undefined' && window.location.protocol === 'https:';

configureEcho({
    broadcaster: 'reverb',
    key: import.meta.env.VITE_REVERB_APP_KEY,
    wsHost:
        typeof window !== 'undefined' ? window.location.hostname : 'localhost',
    wsPort: import.meta.env.VITE_REVERB_PORT
        ? Number(import.meta.env.VITE_REVERB_PORT)
        : 8080,
    wssPort: import.meta.env.VITE_REVERB_PORT
        ? Number(import.meta.env.VITE_REVERB_PORT)
        : 8080,
    forceTLS: isHttps,
    enabledTransports: ['ws', 'wss'],
});

const appName = import.meta.env.VITE_APP_NAME || 'Laravel';

function GlobalAppWrapper({ App, props }: { App: any; props: any }) {
    const [loadingState, setLoadingState] = useState<{
        visible: boolean;
        state: 'signing-in' | 'signing-out' | 'authenticating' | 'verifying';
    } | null>(null);

    useEffect(() => {
        const removeStartListener = router.on('start', (event) => {
            const url = event.detail.visit.url;
            const pathname = typeof url === 'string' ? url : url.pathname;
            const method = event.detail.visit.method.toLowerCase();

            // Only trigger loading overlay on POST requests (form submissions), not links/GET requests
            if (method === 'post') {
                if (pathname.includes('/logout')) {
                    setLoadingState({ visible: true, state: 'signing-out' });
                } else if (
                    pathname.includes('/login') ||
                    pathname.includes('/admin-login') ||
                    pathname.includes('/program-head-login')
                ) {
                    setLoadingState({ visible: true, state: 'signing-in' });
                }
            }
        });

        const removeFinishListener = router.on('finish', () => {
            setLoadingState(null);
        });

        return () => {
            removeStartListener();
            removeFinishListener();
        };
    }, []);

    return (
        <>
            <App {...props} />
            <AuthLoadingOverlay
                visible={loadingState !== null}
                state={loadingState?.state || 'authenticating'}
            />
        </>
    );
}

createInertiaApp({
    title: (title) => (title ? `${title} - ${appName}` : appName),
    resolve: (name) =>
        resolvePageComponent(
            `./pages/${name}.tsx`,
            import.meta.glob('./pages/**/*.tsx'),
        ),
    setup({ el, App, props }) {
        const root = createRoot(el);

        root.render(
            <StrictMode>
                <GlobalAppWrapper App={App} props={props} />
            </StrictMode>,
        );
    },
    progress: {
        color: '#4B5563',
    },
});

// This will set light / dark mode on load...
initializeTheme();
