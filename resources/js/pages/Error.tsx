import { Button } from '@/components/ui/button';
import { Head, Link } from '@inertiajs/react';
import { Home, AlertCircle, RefreshCw, ArrowLeft } from 'lucide-react';

interface ErrorPageProps {
    status: number;
}

export default function Error({ status }: ErrorPageProps) {
    // Check if there's a previous page
    const hasPreviousPage = typeof document !== 'undefined' && document.referrer !== '';

    const getErrorMessage = () => {
        switch (status) {
            case 404:
                return "Page Not Found";
            case 403:
                return "Access Forbidden";
            case 405:
                return "Method Not Allowed";
            case 500:
                return "Server Error";
            default:
                return "Something Went Wrong";
        }
    };

    const getErrorDescription = () => {
        switch (status) {
            case 404:
                return "The page you are looking for doesn't exist or has been moved.";
            case 403:
                return "You don't have permission to access this page.";
            case 405:
                return "The method used to access this page is not allowed.";
            case 500:
                return "We're sorry, but something went wrong on our end.";
            default:
                return "Oops! An unexpected error has occurred.";
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 p-4">
            <Head title={`${status} Error`} />

            <div className="max-w-md w-full bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 border border-gray-200 dark:border-gray-700">
                {/* Icon */}
                <div className="flex justify-center mb-6">
                    <div className="p-4 bg-red-50 dark:bg-red-900/20 rounded-full">
                        <AlertCircle className="h-12 w-12 text-red-500 dark:text-red-400" />
                    </div>
                </div>

                {/* Status Code */}
                <div className="text-center mb-4">
                    <h1 className="text-6xl font-bold text-gray-900 dark:text-white mb-2">
                        {status}
                    </h1>
                    <h2 className="text-2xl font-semibold text-gray-800 dark:text-gray-200">
                        {getErrorMessage()}
                    </h2>
                </div>

                {/* Description */}
                <p className="text-center text-gray-600 dark:text-gray-400 mb-8 leading-relaxed">
                    {getErrorDescription()}
                </p>

                {/* Buttons */}
                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                    {hasPreviousPage && (
                        <Button
                            variant="ghost"
                            onClick={() => window.history.back()}
                            className="w-full sm:w-auto flex items-center gap-2"
                        >
                            <ArrowLeft className="h-4 w-4" />
                            Back
                        </Button>
                    )}

                    <Button
                        asChild
                        className="bg-blue-600 hover:bg-blue-700 text-white w-full sm:w-auto"
                    >
                        <Link href="/" className="flex items-center gap-2">
                            <Home className="h-4 w-4" />
                            Go Home
                        </Link>
                    </Button>

                    <Button
                        variant="secondary"
                        onClick={() => window.location.reload()}
                        className="w-full sm:w-auto flex items-center gap-2"
                    >
                        <RefreshCw className="h-4 w-4" />
                        Try Again
                    </Button>
                </div>
            </div>
        </div>
    );
}
