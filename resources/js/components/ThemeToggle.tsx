import { useAppearance } from '@/hooks/use-appearance';
import { cn } from '@/lib/utils';
import { Moon, Sun } from 'lucide-react';
import React from 'react';

interface ThemeToggleProps {
    className?: string;
    variant?: 'header' | 'dropdown' | 'sidebar' | 'ghost';
    showLabel?: boolean;
}

export function ThemeToggle({
    className,
    variant = 'header',
    showLabel = false,
}: ThemeToggleProps) {
    const { resolvedAppearance, updateAppearance } = useAppearance();
    const isDark = resolvedAppearance === 'dark';

    const toggleTheme = (e?: React.MouseEvent) => {
        if (e) {
            e.preventDefault();
            e.stopPropagation();
        }
        updateAppearance(isDark ? 'light' : 'dark');
    };

    if (variant === 'dropdown') {
        return (
            <button
                type="button"
                onClick={toggleTheme}
                className={cn(
                    'flex w-full cursor-pointer items-center justify-between px-2 py-2 text-sm font-medium rounded-xl transition-colors hover:bg-slate-100 dark:hover:bg-white/10',
                    className,
                )}
            >
                <div className="flex items-center gap-3">
                    {isDark ? (
                        <Sun className="h-4 w-4 text-amber-400 transition-transform duration-300 rotate-0" />
                    ) : (
                        <Moon className="h-4 w-4 text-slate-500 transition-transform duration-300" />
                    )}
                    <span>Theme</span>
                </div>
                <span className="rounded-md bg-slate-200/70 px-2 py-0.5 text-xs font-semibold text-slate-700 capitalize dark:bg-white/10 dark:text-slate-300">
                    {resolvedAppearance}
                </span>
            </button>
        );
    }

    if (variant === 'sidebar') {
        return (
            <button
                type="button"
                onClick={toggleTheme}
                className={cn(
                    'flex w-full cursor-pointer items-center justify-between rounded-xl px-3 py-2 text-xs font-medium text-slate-600 transition-all hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-100',
                    className,
                )}
                title={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            >
                <div className="flex items-center gap-2.5">
                    {isDark ? (
                        <Sun className="h-4 w-4 text-amber-400" />
                    ) : (
                        <Moon className="h-4 w-4 text-slate-500" />
                    )}
                    <span>Dark Mode</span>
                </div>
                <div
                    className={cn(
                        'relative h-5 w-9 rounded-full transition-colors duration-200 ease-in-out',
                        isDark ? 'bg-blue-600' : 'bg-slate-300 dark:bg-slate-700',
                    )}
                >
                    <span
                        className={cn(
                            'inline-block h-4 w-4 transform rounded-full bg-white shadow-sm transition-transform duration-200 ease-in-out mt-0.5 ml-0.5',
                            isDark ? 'translate-x-4' : 'translate-x-0',
                        )}
                    />
                </div>
            </button>
        );
    }

    // Default: 'header' or 'ghost'
    return (
        <button
            type="button"
            onClick={toggleTheme}
            className={cn(
                'group relative flex h-9 w-9 sm:h-10 sm:w-10 items-center justify-center rounded-full text-white transition-all duration-200 hover:bg-white/15 active:scale-95 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/50',
                className,
            )}
            title={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            aria-label={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
        >
            <div className="relative h-4 w-4 sm:h-5 sm:w-5">
                <Sun
                    className={cn(
                        'absolute inset-0 h-full w-full text-amber-300 transition-all duration-300 transform',
                        isDark
                            ? 'rotate-0 scale-100 opacity-100'
                            : 'rotate-90 scale-0 opacity-0',
                    )}
                />
                <Moon
                    className={cn(
                        'absolute inset-0 h-full w-full text-white/90 transition-all duration-300 transform',
                        isDark
                            ? '-rotate-90 scale-0 opacity-0'
                            : 'rotate-0 scale-100 opacity-100',
                    )}
                />
            </div>
            {showLabel && (
                <span className="ml-2 text-xs font-semibold capitalize">
                    {resolvedAppearance}
                </span>
            )}
        </button>
    );
}

export default ThemeToggle;
