import { Loader2 } from 'lucide-react';

interface LoadingOverlayProps {
    isVisible: boolean;
    text?: string;
}

export function LoadingOverlay({ isVisible, text }: LoadingOverlayProps) {
    if (!isVisible) return null;

    return (
        <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-white/80 backdrop-blur-sm transition-all duration-300 dark:bg-slate-950/80">
            <Loader2 className="h-12 w-12 animate-spin text-blue-600 dark:text-blue-500" />
            {text && (
                <p className="mt-4 text-lg font-medium text-slate-800 dark:text-slate-200">
                    {text}
                </p>
            )}
        </div>
    );
}
