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

export function formatTimeTo12Hour(raw?: string | null, fallback: string = '—'): string {
    const value = String(raw ?? '').trim();
    if (!value || value === '—') return fallback;

    // If already in 12-hour AM/PM format
    if (/(am|pm)$/i.test(value)) return value;

    // Match "HH:mm" or "HH:mm:ss"
    const timeMatch = value.match(/^(\d{1,2}):(\d{2})(?::\d{2})?$/);
    if (timeMatch) {
        const hh = Number.parseInt(timeMatch[1], 10);
        const mm = timeMatch[2];
        if (Number.isFinite(hh) && hh >= 0 && hh <= 23) {
            const suffix = hh >= 12 ? 'PM' : 'AM';
            const hour12 = ((hh + 11) % 12) + 1;
            return `${hour12}:${mm} ${suffix}`;
        }
    }

    // Match ISO or timestamp string with date and time
    if (value.includes('T') || value.includes('-') || value.includes(' ')) {
        try {
            const d = new Date(value);
            if (!isNaN(d.getTime())) {
                return d.toLocaleTimeString('en-US', {
                    hour: 'numeric',
                    minute: '2-digit',
                    hour12: true,
                });
            }
        } catch {}
    }

    return value;
}

export function formatDate(raw?: string | Date | number | null, fallback: string = '—'): string {
    if (!raw) return fallback;
    try {
        const date = typeof raw === 'object' && raw instanceof Date ? raw : new Date(raw);
        if (isNaN(date.getTime())) return fallback;
        return date.toLocaleDateString('en-US', {
            month: 'long',
            day: 'numeric',
            year: 'numeric',
        });
    } catch {
        return fallback;
    }
}

export function formatTime(raw?: string | Date | number | null, fallback: string = '—'): string {
    if (!raw) return fallback;
    if (typeof raw === 'string') {
        return formatTimeTo12Hour(raw, fallback);
    }
    try {
        const date = typeof raw === 'object' && raw instanceof Date ? raw : new Date(raw);
        if (isNaN(date.getTime())) return fallback;
        return date.toLocaleTimeString('en-US', {
            hour: 'numeric',
            minute: '2-digit',
            hour12: true,
        });
    } catch {
        return fallback;
    }
}

export function formatDateTime(raw?: string | Date | number | null, fallback: string = '—'): string {
    if (!raw) return fallback;
    try {
        const date = typeof raw === 'object' && raw instanceof Date ? raw : new Date(raw);
        if (isNaN(date.getTime())) return fallback;
        const formattedDate = date.toLocaleDateString('en-US', {
            month: 'long',
            day: 'numeric',
            year: 'numeric',
        });
        const formattedTime = date.toLocaleTimeString('en-US', {
            hour: 'numeric',
            minute: '2-digit',
            hour12: true,
        });
        return `${formattedDate}, ${formattedTime}`;
    } catch {
        return fallback;
    }
}

