export type CalendarEventKind = 'event' | 'holiday';

export type HolidayEvent = {
    id: string;
    title: string;
    date: string;
    time: string;
    kind: 'holiday';
};

function toISODate(date: Date) {
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

function getEasterSunday(year: number) {
    const a = year % 19;
    const b = Math.floor(year / 100);
    const c = year % 100;
    const d = Math.floor(b / 4);
    const e = b % 4;
    const f = Math.floor((b + 8) / 25);
    const g = Math.floor((b - f + 1) / 3);
    const h = (19 * a + b - d - g + 15) % 30;
    const i = Math.floor(c / 4);
    const k = c % 4;
    const l = (32 + 2 * e + 2 * i - h - k) % 7;
    const m = Math.floor((a + 11 * h + 22 * l) / 451);
    const month = Math.floor((h + l - 7 * m + 114) / 31);
    const day = ((h + l - 7 * m + 114) % 31) + 1;
    return new Date(year, month - 1, day);
}

export function getPhilippinesHolidayEvents(year: number): HolidayEvent[] {
    const fixed: Array<{ title: string; monthIndex: number; day: number }> = [
        { title: "New Year's Day", monthIndex: 0, day: 1 },
        { title: 'Araw ng Kagitingan', monthIndex: 3, day: 9 },
        { title: 'Labor Day', monthIndex: 4, day: 1 },
        { title: 'Independence Day', monthIndex: 5, day: 12 },
        { title: 'Ninoy Aquino Day', monthIndex: 7, day: 21 },
        { title: "All Saints' Day", monthIndex: 10, day: 1 },
        { title: 'Bonifacio Day', monthIndex: 10, day: 30 },
        { title: 'Feast of the Immaculate Conception', monthIndex: 11, day: 8 },
        { title: 'Christmas Day', monthIndex: 11, day: 25 },
        { title: 'Rizal Day', monthIndex: 11, day: 30 },
    ];

    const easter = getEasterSunday(year);
    const maundyThursday = new Date(easter);
    maundyThursday.setDate(easter.getDate() - 3);
    const goodFriday = new Date(easter);
    goodFriday.setDate(easter.getDate() - 2);

    const movable: Array<{ title: string; date: Date }> = [
        { title: 'Maundy Thursday', date: maundyThursday },
        { title: 'Good Friday', date: goodFriday },
    ];

    const out: HolidayEvent[] = [];

    for (const h of fixed) {
        const date = new Date(year, h.monthIndex, h.day);
        out.push({
            id: `holiday-${year}-${h.monthIndex + 1}-${h.day}`,
            title: h.title,
            date: toISODate(date),
            time: 'Holiday',
            kind: 'holiday',
        });
    }

    for (const h of movable) {
        out.push({
            id: `holiday-${toISODate(h.date)}-${h.title.replaceAll(' ', '-')}`,
            title: h.title,
            date: toISODate(h.date),
            time: 'Holiday',
            kind: 'holiday',
        });
    }

    return out;
}
