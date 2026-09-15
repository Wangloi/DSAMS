/** Same calendar-day and time rules as `Event::deriveLifecycleStatusFromDate` (app-local date & time). */
export function deriveEventLifecycleStatus(
    isoDateYmd: string,
    eventTime?: string | null,
    registrationEndTime?: string | null,
): 'upcoming' | 'ongoing' | 'completed' {
    const raw = (isoDateYmd || '').trim().slice(0, 10);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(raw)) {
        return 'upcoming';
    }

    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const todayYmd = `${year}-${month}-${day}`;

    // Past date -> completed / ended
    if (raw < todayYmd) {
        return 'completed';
    }
    // Future date -> upcoming
    if (raw > todayYmd) {
        return 'upcoming';
    }

    // Event is today: check specific time cutoffs
    if (registrationEndTime) {
        try {
            const timePart = registrationEndTime.trim();
            const fullTime = timePart.length === 5 ? `${timePart}:00` : timePart;
            const cutoff = new Date(`${raw}T${fullTime}`);
            if (!isNaN(cutoff.getTime()) && now >= cutoff) {
                return 'completed';
            }
        } catch {
            // ignore parsing failure
        }
    }

    if (eventTime) {
        const timeStr = eventTime.trim();
        if (timeStr.includes('-') || timeStr.includes('–') || timeStr.includes('to')) {
            const parts = timeStr.split(/[-–]|to/).map((s) => s.trim());
            if (parts.length >= 2) {
                const endParsed = new Date(`${raw} ${parts[1]}`);
                if (!isNaN(endParsed.getTime()) && now >= endParsed) {
                    return 'completed';
                }
                const startParsed = new Date(`${raw} ${parts[0]}`);
                if (!isNaN(startParsed.getTime()) && now < startParsed) {
                    return 'upcoming';
                }
                return 'ongoing';
            }
        }
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
        case 'ended':
            return 'bg-slate-100 text-slate-800 dark:bg-slate-800/80 dark:text-slate-300';
        default:
            return 'bg-slate-100 text-slate-800';
    }
}
