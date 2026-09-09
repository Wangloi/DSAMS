import type { InertiaLinkProps } from '@inertiajs/react';
import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

export function toUrl(url: NonNullable<InertiaLinkProps['href']>): string {
    return typeof url === 'string' ? url : url.url;
}

export function formatTimeAgo(dateStr?: string | null, fallback?: string): string {
    if (!dateStr) return fallback || '';
    try {
        const date = new Date(dateStr);
        if (isNaN(date.getTime())) return fallback || '';
        const now = new Date();
        const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

        if (diffInSeconds < 0 || diffInSeconds < 60) return 'Just now';
        if (diffInSeconds < 3600) {
            const mins = Math.floor(diffInSeconds / 60);
            return `${mins} ${mins === 1 ? 'minute' : 'minutes'} ago`;
        }
        if (diffInSeconds < 86400) {
            const hours = Math.floor(diffInSeconds / 3600);
            return `${hours} ${hours === 1 ? 'hour' : 'hours'} ago`;
        }
        if (diffInSeconds < 604800) {
            const days = Math.floor(diffInSeconds / 86400);
            return `${days} ${days === 1 ? 'day' : 'days'} ago`;
        }

        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    } catch {
        return fallback || 'Recently';
    }
}
