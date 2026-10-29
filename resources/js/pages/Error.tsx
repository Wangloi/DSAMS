import { Button } from '@/components/ui/button';
import { Head, Link, router, usePage } from '@inertiajs/react';
import { AlertCircle, ArrowLeft, Home, RefreshCw, ShieldAlert } from 'lucide-react';

interface ErrorPageProps {
    status: number;
    message?: string;
}

export default function Error({ status, message }: ErrorPageProps) {
    const page = usePage();
    const auth = (page.props as any)?.auth;
    const backUrl = auth?.backUrl || '/';

    const handleGoBack = () => {
        if (typeof window !== 'undefined' && window.history.length > 1 && document.referrer) {
            window.history.back();
        } else {
            router.visit(backUrl);
        }
    };

    const getErrorMessage = () => {
        if (message) return message;
        switch (status) {
            case 404:
                return 'Page Not Found';
            case 403:
                return 'Access Forbidden';
            case 401:
                return 'Unauthorized Access';
            case 405:
                return 'Method Not Allowed';
            case 419:
                return 'Page Expired';
            case 500:
                return 'Server Error';
            default:
                return 'Something Went Wrong';
        }
    };

    const getErrorDescription = () => {
        switch (status) {
            case 404:
                return "The page you are looking for doesn't exist, was removed, or the URL might have been mistyped.";
            case 403:
                return "You don't have permission to access this page or area with your current account role.";
            case 401:
                return "Your session has expired or you need to log in to access this page.";
            case 405:
                return 'The action or method used to access this page is not supported.';
            case 419:
                return 'Your session has expired due to inactivity. Please refresh the page or go back.';
            case 500:
                return "We're sorry, but an unexpected server error occurred on our end. Please try again shortly.";
            default:
                return 'An unexpected error occurred while processing your request.';
        }
    };

    const isForbidden = status === 403 || status === 401;

    return (
        <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-slate-50 px-4 py-12 transition-colors dark:bg-[#020817] sm:px-6">
            {/* Ambient Background Glows */}
            <div className="pointer-events-none absolute -top-40 -left-40 h-96 w-96 rounded-full bg-blue-500/10 blur-3xl dark:bg-blue-600/10" />
            <div className="pointer-events-none absolute -bottom-40 -right-40 h-96 w-96 rounded-full bg-cyan-500/10 blur-3xl dark:bg-cyan-600/10" />

            <Head title={`${status} - ${getErrorMessage()}`} />

            <div className="relative z-10 w-full max-w-lg rounded-3xl border border-slate-200/90 bg-white/95 p-6 sm:p-10 shadow-2xl backdrop-blur-xl transition-all dark:border-slate-800 dark:bg-[#0B192C]/95">
                {/* SRCB & DSA Branding Header */}
                <div className="mb-6 flex items-center justify-center gap-3">
                    <img
                        src="/images/SRCB.png"
                        alt="SRCB Logo"
                        className="h-11 w-11 rounded-full object-cover shadow-sm ring-2 ring-blue-900/10 dark:ring-white/20"
                    />
                    <div className="h-6 w-px bg-slate-200 dark:bg-slate-700" />
                    <img
                        src="/images/DSA.png"
                        alt="DSA Logo"
                        className="h-11 w-11 rounded-full object-cover shadow-sm ring-2 ring-blue-900/10 dark:ring-white/20"
                    />
                </div>

                {/* Status Icon Badge */}
                <div className="mb-5 flex justify-center">
                    <div
                        className={
                            isForbidden
                                ? 'flex h-16 w-16 items-center justify-center rounded-2xl bg-amber-500/15 text-amber-600 ring-8 ring-amber-500/10 dark:bg-amber-500/20 dark:text-amber-400'
                                : status === 404
                                ? 'flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-500/15 text-blue-600 ring-8 ring-blue-500/10 dark:bg-blue-500/20 dark:text-blue-400'
                                : 'flex h-16 w-16 items-center justify-center rounded-2xl bg-rose-500/15 text-rose-600 ring-8 ring-rose-500/10 dark:bg-rose-500/20 dark:text-rose-400'
                        }
                    >
                        {isForbidden ? (
                            <ShieldAlert className="h-8 w-8" />
                        ) : (
                            <AlertCircle className="h-8 w-8" />
                        )}
                    </div>
                </div>

                {/* Status Code & Headings */}
                <div className="mb-4 text-center">
                    <div className="text-xs font-black tracking-widest uppercase text-blue-600 dark:text-blue-400">
                        HTTP {status}
                    </div>
                    <h1 className="mt-1 text-2xl font-black tracking-tight text-slate-900 dark:text-white sm:text-3xl">
                        {getErrorMessage()}
                    </h1>
                </div>

                {/* Detailed Description */}
                <p className="mb-8 text-center text-sm leading-relaxed text-slate-600 dark:text-slate-300">
                    {getErrorDescription()}
                </p>

                {/* Action Buttons */}
                <div className="flex flex-col gap-2.5 sm:flex-row sm:items-center sm:justify-center">
                    {/* Primary "Please Go Back" Button */}
                    <Button
                        type="button"
                        onClick={handleGoBack}
                        className="flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#0b2d66] via-[#103875] to-[#1e40af] px-6 text-sm font-bold text-white shadow-md shadow-blue-900/20 transition-all hover:scale-[1.02] hover:shadow-lg active:scale-95 sm:w-auto cursor-pointer"
                    >
                        <ArrowLeft className="h-4 w-4" />
                        Please Go Back
                    </Button>

                    {/* Secondary Dashboard / Home Button */}
                    <Button
                        asChild
                        variant="outline"
                        className="flex h-11 w-full items-center justify-center gap-2 rounded-xl border-slate-200 bg-white px-5 text-sm font-semibold text-slate-700 shadow-xs hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700 sm:w-auto cursor-pointer"
                    >
                        <Link href={backUrl}>
                            <Home className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                            {auth?.user ? 'My Dashboard' : 'Go Home'}
                        </Link>
                    </Button>

                    {/* Try Again / Reload */}
                    <Button
                        type="button"
                        variant="ghost"
                        onClick={() => window.location.reload()}
                        className="flex h-11 w-full items-center justify-center gap-2 rounded-xl text-xs font-medium text-slate-500 hover:bg-slate-100 hover:text-slate-800 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-200 sm:w-auto cursor-pointer"
                        title="Reload page"
                    >
                        <RefreshCw className="h-3.5 w-3.5" />
                        Reload
                    </Button>
                </div>
            </div>
        </div>
    );
}
