import { createInertiaApp, router } from '@inertiajs/react';
import axios from 'axios';
import { resolvePageComponent } from 'laravel-vite-plugin/inertia-helpers';
import { StrictMode, useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import '../css/app.css';
import Swal from 'sweetalert2';
import { AuthLoadingOverlay } from './components/AuthLoadingOverlay';
import { initializeTheme } from './hooks/use-appearance';

// Configure axios with CSRF token for all requests
// Laravel sets an XSRF-TOKEN cookie; axios reads it automatically as X-XSRF-TOKEN
axios.defaults.withCredentials = true;
axios.defaults.withXSRFToken = true;
axios.defaults.headers.common['X-Requested-With'] = 'XMLHttpRequest';

const appName = import.meta.env.VITE_APP_NAME || 'Laravel';

function GlobalAppWrapper({ App, props }: { App: any; props: any }) {
    const [loadingState, setLoadingState] = useState<{
        visible: boolean;
        state: 'signing-in' | 'signing-out' | 'authenticating' | 'verifying';
    } | null>(null);

    useEffect(() => {
        let activeAction: 'signing-in' | 'signing-out' | null = null;

        const removeStartListener = router.on('start', (event) => {
            const url = event.detail.visit.url;
            const pathname = typeof url === 'string' ? url : url.pathname;
            const method = event.detail.visit.method.toLowerCase();

            // Only trigger loading overlay on POST requests (form submissions), not links/GET requests
            if (method === 'post') {
                if (pathname.includes('/logout') || pathname.includes('/student-logout')) {
                    activeAction = 'signing-out';
                    setLoadingState({ visible: true, state: 'signing-out' });
                } else if (
                    pathname.includes('/login') ||
                    pathname.includes('/admin-login') ||
                    pathname.includes('/program-head-login') ||
                    pathname.includes('/student-login') ||
                    pathname.includes('/two-factor-challenge') ||
                    pathname.includes('/register')
                ) {
                    activeAction = 'signing-in';
                    setLoadingState({ visible: true, state: 'signing-in' });
                }
            }
        });

        const removeSuccessListener = router.on('success', (event) => {
            if (activeAction === 'signing-in') {
                const pageProps = (event.detail.page?.props as any) || {};
                const userName =
                    pageProps?.auth?.user?.name ||
                    pageProps?.user?.name ||
                    '';
                const flashMessage =
                    pageProps?.flash?.success || pageProps?.flash?.status;
                const message =
                    flashMessage ||
                    (userName
                        ? `Welcome back, ${userName}!`
                        : 'You have signed in successfully.');

                Swal.fire({
                    icon: 'success',
                    title: 'Login Successful!',
                    text: message,
                    timer: 2000,
                    timerProgressBar: true,
                    showConfirmButton: false,
                    customClass: {
                        popup: 'rounded-3xl p-6 shadow-2xl font-sans border border-slate-100 dark:border-slate-800 dark:bg-[#051139]',
                        title: 'text-2xl font-black text-[#0b2d66] dark:text-white',
                        htmlContainer:
                            'text-sm text-slate-600 dark:text-slate-300 font-medium mt-2',
                    },
                });
            } else if (activeAction === 'signing-out') {
                Swal.fire({
                    icon: 'success',
                    title: 'Signed Out',
                    text: 'You have been safely logged out.',
                    timer: 1500,
                    timerProgressBar: true,
                    showConfirmButton: false,
                    customClass: {
                        popup: 'rounded-3xl p-6 shadow-2xl font-sans border border-slate-100 dark:border-slate-800 dark:bg-[#051139]',
                        title: 'text-2xl font-black text-[#0b2d66] dark:text-white',
                        htmlContainer:
                            'text-sm text-slate-600 dark:text-slate-300 font-medium mt-2',
                    },
                });
            }
            activeAction = null;
        });

        const removeFinishListener = router.on('finish', () => {
            setLoadingState(null);
        });

        return () => {
            removeStartListener();
            removeSuccessListener();
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

