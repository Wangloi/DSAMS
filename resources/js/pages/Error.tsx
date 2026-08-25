import { Button } from '@/components/ui/button';
import { Head, Link } from '@inertiajs/react';
import { AlertCircle, ArrowLeft, Home, RefreshCw } from 'lucide-react';

interface ErrorPageProps {
    status: number;
}

export default function Error({ status }: ErrorPageProps) {
    // Check if there's a previous page
    const hasPreviousPage =
        typeof document !== 'undefined' && document.referrer !== '';

    const getErrorMessage = () => {
        switch (status) {
            case 404:
                return 'Page Not Found';
            case 403:
                return 'Access Forbidden';
            case 405:
                return 'Method Not Allowed';
            case 500:
                return 'Server Error';
            default:
                return 'Something Went Wrong';
        }
    };

    const getErrorDescription = () => {
        switch (status) {
            case 404:
                return "The page you are looking for doesn't exist or has been moved.";
            case 403:
                return "You don't have permission to access this page.";
            case 405:
                return 'The method used to access this page is not allowed.';
            case 500:
                return "We're sorry, but something went wrong on our end.";
            default:
                return 'Oops! An unexpected error has occurred.';
        }
    };

    return (
        <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 p-4 dark:from-gray-900 dark:to-gray-800">
            <Head title={`${status} Error`} />

            <div className="w-full max-w-md rounded-2xl border border-gray-200 bg-white p-8 shadow-xl dark:border-gray-700 dark:bg-gray-800">
                {/* Icon */}
                <div className="mb-6 flex justify-center">
                    <div className="rounded-full bg-red-50 p-4 dark:bg-red-900/20">
                        <AlertCircle className="h-12 w-12 text-red-500 dark:text-red-400" />
                    </div>
                </div>

                {/* Status Code */}
                <div className="mb-4 text-center">
                    <h1 className="mb-2 text-6xl font-bold text-gray-900 dark:text-white">
                        {status}
                    </h1>
                    <h2 className="text-2xl font-semibold text-gray-800 dark:text-gray-200">
                        {getErrorMessage()}
                    </h2>
                </div>

                {/* Description */}
                <p className="mb-8 text-center leading-relaxed text-gray-600 dark:text-gray-400">
                    {getErrorDescription()}
                </p>

                {/* Buttons */}
                <div className="flex flex-col justify-center gap-3 sm:flex-row">
                    {hasPreviousPage && (
                        <Button
                            variant="ghost"
                            onClick={() => window.history.back()}
                            className="flex w-full items-center gap-2 sm:w-auto"
                        >
                            <ArrowLeft className="h-4 w-4" />
                            Back
                        </Button>
                    )}

                    <Button
                        asChild
                        className="w-full bg-blue-600 text-white hover:bg-blue-700 sm:w-auto"
                    >
                        <Link href="/" className="flex items-center gap-2">
                            <Home className="h-4 w-4" />
                            Go Home
                        </Link>
                    </Button>

                    <Button
                        variant="secondary"
                        onClick={() => window.location.reload()}
                        className="flex w-full items-center gap-2 sm:w-auto"
                    >
                        <RefreshCw className="h-4 w-4" />
                        Try Again
                    </Button>
                </div>
            </div>
        </div>
    );
}
