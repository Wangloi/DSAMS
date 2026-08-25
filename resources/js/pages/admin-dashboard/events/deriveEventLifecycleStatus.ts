/** Same calendar-day rules as `Event::deriveLifecycleStatusFromDate` (app-local date). */
export function deriveEventLifecycleStatus(
    isoDateYmd: string,
): 'upcoming' | 'ongoing' | 'completed' {
    const raw = (isoDateYmd || '').trim().slice(0, 10);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(raw)) {
        return 'upcoming';
    }
    const ev = new Date(`${raw}T12:00:00`);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    ev.setHours(0, 0, 0, 0);
    if (ev < today) {
        return 'completed';
    }
    if (ev > today) {
        return 'upcoming';
    }
    return 'ongoing';
}

export function lifecycleStatusBadgeClass(status: string): string {
    switch (status) {
        case 'upcoming':
            return 'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-200';
        case 'ongoing':
            return 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-200';
        case 'completed':
            return 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-200';
        default:
            return 'bg-slate-100 text-slate-800';
    }
}
