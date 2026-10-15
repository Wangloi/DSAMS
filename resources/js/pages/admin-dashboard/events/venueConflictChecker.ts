/**
 * Venue and Schedule Conflict Detection Utility
 * Mirrors backend conflict detection to provide instant real-time feedback
 * and prevent duplicate venue booking.
 */

export interface VenueConflictResult {
    conflict: boolean;
    conflictingEvent?: any;
    message?: string;
}

const GENERICS = new Set([
    'campus / unspecified',
    'campus/unspecified',
    'unspecified',
    'tba',
    'to be announced',
    'n/a',
    'none',
    'campus',
    'tbd',
]);

const ALIASES: Record<string, string> = {
    gym: 'gymnasium',
    avr: 'audio visual room',
    'audiovisual room': 'audio visual room',
    'audiovisual room avr': 'audio visual room',
    'audio visual room avr': 'audio visual room',
    lib: 'college library',
    library: 'college library',
    caf: 'cafeteria',
    canteen: 'cafeteria',
};

/**
 * Check if two location names refer to the same venue or conflicting sub-venue.
 */
export function areLocationsConflicting(loc1?: string | null, loc2?: string | null): boolean {
    if (!loc1 || !loc2) return false;

    const l1 = loc1.trim().toLowerCase();
    const l2 = loc2.trim().toLowerCase();

    if (GENERICS.has(l1) || GENERICS.has(l2)) return false;
    if (l1 === l2) return true;

    const norm1 = l1.replace(/[^\w\s]/g, ' ').replace(/\s+/g, ' ').trim();
    const norm2 = l2.replace(/[^\w\s]/g, ' ').replace(/\s+/g, ' ').trim();

    if (norm1 === norm2) return true;

    const canon1 = ALIASES[norm1] || norm1;
    const canon2 = ALIASES[norm2] || norm2;

    if (canon1 === canon2) return true;

    // Distinct room/floor matching to prevent "Room 101" false-matching "Room 102"
    const roomRegex = /\b(room|rm|floor|flr|lab|laboratory|hall|bldg|building)\s*(\d+|[a-z])\b/i;
    const m1 = norm1.match(roomRegex);
    const m2 = norm2.match(roomRegex);

    if (m1 && m2) {
        return m1[0].toLowerCase() === m2[0].toLowerCase() && (
            canon1 === canon2 ||
            canon1.includes(canon2) ||
            canon2.includes(canon1)
        );
    }

    if (norm1.includes(norm2) || norm2.includes(norm1)) {
        if (m1 || m2) return false;
        return true;
    }

    return false;
}

/**
 * Parse a time string into minutes from start of day (0..1439).
 * Supports "14:30", "02:30 PM", "8:00 AM", etc.
 */
export function parseTimeToMinutes(timeStr?: string | null): number | null {
    if (!timeStr) return null;
    const raw = timeStr.trim();
    if (!raw) return null;

    // Handle range like "08:00 - 12:00" -> extract first part
    const firstPart = raw.split(/[-–—to]/i)[0].trim();

    const ampmMatch = firstPart.match(/(\d{1,2}):(\d{2})(?::\d{2})?\s*(AM|PM)?/i);
    if (ampmMatch) {
        let hours = parseInt(ampmMatch[1], 10);
        const minutes = parseInt(ampmMatch[2], 10);
        const meridian = ampmMatch[3]?.toUpperCase();

        if (meridian === 'PM' && hours < 12) hours += 12;
        if (meridian === 'AM' && hours === 12) hours = 0;

        return hours * 60 + minutes;
    }

    // Try standard HH:MM
    const parts = firstPart.split(':');
    if (parts.length >= 2) {
        const h = parseInt(parts[0], 10);
        const m = parseInt(parts[1], 10);
        if (!isNaN(h) && !isNaN(m)) {
            return h * 60 + m;
        }
    }

    return null;
}

/**
 * Extract start and end time in minutes for an event or proposed time inputs.
 */
export function resolveEventWindowMinutes(
    timeStr?: string | null,
    endTimeStr?: string | null,
): { start: number; end: number } | null {
    if (!timeStr) return null;

    let start = parseTimeToMinutes(timeStr);
    if (start === null) return null;

    let end: number | null = null;

    // If timeStr itself is a range e.g. "08:00 - 12:00"
    const rangeParts = timeStr.split(/[-–—to]/i);
    if (rangeParts.length >= 2 && rangeParts[1].trim()) {
        end = parseTimeToMinutes(rangeParts[1].trim());
    }

    // If explicit registrationEndTime is provided, it takes precedence as end boundary
    if (endTimeStr) {
        const parsedEnd = parseTimeToMinutes(endTimeStr);
        if (parsedEnd !== null) {
            end = parsedEnd;
        }
    }

    // Default to start + 120 minutes (2 hours) if no end time is specified
    if (end === null || end <= start) {
        end = Math.min(start + 120, 1440);
    }

    return { start, end };
}

/**
 * Check if a proposed event venue & schedule conflicts with existing active events.
 */
export function findVenueConflict(
    existingEvents: any[],
    targetDate: string,
    targetLocation: string,
    targetStartTime: string,
    targetEndTime?: string | null,
    ignoreEventId?: string | number | null,
): VenueConflictResult {
    if (!existingEvents || !Array.isArray(existingEvents) || !targetDate || !targetLocation.trim() || !targetStartTime) {
        return { conflict: false };
    }

    const cleanDate = targetDate.split('T')[0].trim();
    if (!cleanDate) return { conflict: false };

    const targetWindow = resolveEventWindowMinutes(targetStartTime, targetEndTime);
    if (!targetWindow) return { conflict: false };

    for (const ev of existingEvents) {
        if (!ev) continue;

        // Skip ignored event (e.g. current event being edited)
        if (ignoreEventId && String(ev.id) === String(ignoreEventId)) {
            continue;
        }

        // Skip rejected or archived events
        if (ev.approval_status === 'rejected' || ev.archived_at) {
            continue;
        }

        // Check date
        const evDate = (ev.event_date || ev.eventDate || '').split('T')[0].trim();
        if (evDate !== cleanDate) {
            continue;
        }

        // Check venue / location
        const evLocation = ev.location || '';
        if (!areLocationsConflicting(targetLocation, evLocation)) {
            continue;
        }

        // Check time schedule overlap
        const evStartStr = ev.event_time || ev.eventTime || '';
        const evEndStr = ev.registration_end_time || ev.registrationEndTime || null;
        const evWindow = resolveEventWindowMinutes(evStartStr, evEndStr);

        // If either window cannot be resolved, assume potential conflict on same venue & day
        let isOverlapping = true;
        if (evWindow) {
            isOverlapping = targetWindow.start < evWindow.end && targetWindow.end > evWindow.start;
        }

        if (isOverlapping) {
            const evSchedule = evStartStr + (evEndStr ? ` to ${evEndStr}` : '');
            const evName = ev.event_name || ev.eventName || 'Existing Event';
            return {
                conflict: true,
                conflictingEvent: ev,
                message: `Venue Conflict: "${targetLocation}" is already booked on ${cleanDate} (${evSchedule}) for "${evName}".`,
            };
        }
    }

    return { conflict: false };
}

/**
 * Get map of booked venues for a given date and time window.
 * Useful for showing availability badges on pre-set venue buttons.
 */
export function getBookedVenuesForDate(
    existingEvents: any[],
    targetDate: string,
    targetStartTime?: string | null,
    targetEndTime?: string | null,
    ignoreEventId?: string | number | null,
): Array<{ venue: string; schedule: string; eventName: string; eventId: any }> {
    if (!existingEvents || !Array.isArray(existingEvents) || !targetDate) {
        return [];
    }

    const cleanDate = targetDate.split('T')[0].trim();
    if (!cleanDate) return [];

    const targetWindow = targetStartTime ? resolveEventWindowMinutes(targetStartTime, targetEndTime) : null;
    const booked: Array<{ venue: string; schedule: string; eventName: string; eventId: any }> = [];

    for (const ev of existingEvents) {
        if (!ev) continue;
        if (ignoreEventId && String(ev.id) === String(ignoreEventId)) continue;
        if (ev.approval_status === 'rejected' || ev.archived_at) continue;

        const evDate = (ev.event_date || ev.eventDate || '').split('T')[0].trim();
        if (evDate !== cleanDate) continue;

        const evLoc = (ev.location || '').trim();
        if (!evLoc || GENERICS.has(evLoc.toLowerCase())) continue;

        const evStartStr = ev.event_time || ev.eventTime || '';
        const evEndStr = ev.registration_end_time || ev.registrationEndTime || null;
        const evWindow = resolveEventWindowMinutes(evStartStr, evEndStr);

        let overlaps = true;
        if (targetWindow && evWindow) {
            overlaps = targetWindow.start < evWindow.end && targetWindow.end > evWindow.start;
        }

        if (overlaps) {
            booked.push({
                venue: evLoc,
                schedule: evStartStr + (evEndStr ? ` - ${evEndStr}` : ''),
                eventName: ev.event_name || ev.eventName || 'Scheduled Event',
                eventId: ev.id,
            });
        }
    }

    return booked;
}
