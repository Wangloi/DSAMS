import { cn } from '@/lib/utils';
import { AlertCircle } from 'lucide-react';
import type { HTMLAttributes } from 'react';

export interface InputErrorProps extends HTMLAttributes<HTMLParagraphElement> {
    message?: string;
    id?: string;
    showIcon?: boolean;
}

export default function InputError({
    message,
    className = '',
    id,
    showIcon = true,
    ...props
}: InputErrorProps) {
    if (!message) return null;

    return (
        <p
            id={id}
            role="alert"
            aria-live="polite"
            {...props}
            className={cn(
                'mt-1.5 flex items-center gap-1.5 text-xs font-semibold text-red-600 dark:text-red-400 animate-in fade-in duration-150',
                className
            )}
        >
            {showIcon && (
                <AlertCircle className="h-3.5 w-3.5 shrink-0 text-red-500 dark:text-red-400" aria-hidden="true" />
            )}
            <span>{message}</span>
        </p>
    );
}
