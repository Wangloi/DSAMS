export type CourseYearOption = {
    id: string;
    name: string;
    code: string;
};

/** Strip zero-width / BOM and collapse spaces so “identical” labels dedupe. */
export function normalizeCourseId(raw: string): string {
    return raw
        .replace(/[\u200B-\u200D\uFEFF]/g, '')
        .trim()
        .replace(/\s+/g, ' ');
}

function courseBaseKey(id: string): string {
    const n = normalizeCourseId(id).toLowerCase();
    return n.replace(/\s+program$/i, '').trim();
}

function preferCourseOption(a: CourseYearOption, b: CourseYearOption): CourseYearOption {
    const A = normalizeCourseId(a.id);
    const B = normalizeCourseId(b.id);
    if (A === B) {
        return a;
    }
    const aProg = /program\s*$/i.test(A);
    const bProg = /program\s*$/i.test(B);
    if (aProg && !bProg) {
        return a;
    }
    if (bProg && !aProg) {
        return b;
    }
    return A.length >= B.length ? a : b;
}

/** Collapse “Course” vs “Course Program” and other same-base duplicates. */
export function dedupeCourseRows(rows: CourseYearOption[]): CourseYearOption[] {
    const byBase = new Map<string, CourseYearOption>();
    for (const opt of rows) {
        const id = normalizeCourseId(opt.id);
        if (!id) {
            continue;
        }
        const base = courseBaseKey(id);
        const normalized: CourseYearOption = {
            id,
            name: normalizeCourseId(opt.name || id),
            code: normalizeCourseId(opt.code || id),
        };
        const existing = byBase.get(base);
        if (!existing) {
            byBase.set(base, normalized);
            continue;
        }
        byBase.set(base, preferCourseOption(existing, normalized));
    }
    return Array.from(byBase.values()).sort((a, b) => a.name.localeCompare(b.name));
}

export function mergeAndDedupeCourses(
    template: CourseYearOption[],
    savedCourseIds: string[],
): CourseYearOption[] {
    const rows: CourseYearOption[] = [...template];
    for (const raw of savedCourseIds) {
        const id = normalizeCourseId(raw);
        if (!id) {
            continue;
        }
        rows.push({ id, name: id, code: id });
    }
    return dedupeCourseRows(rows);
}

export function mergeAndDedupeYearLevels(
    template: CourseYearOption[],
    savedYearLevelIds: string[],
): CourseYearOption[] {
    const seen = new Set<string>();
    const out: CourseYearOption[] = [];
    const add = (opt: CourseYearOption) => {
        const id = normalizeCourseId(opt.id);
        if (!id) {
            return;
        }
        const k = id.toLowerCase();
        if (seen.has(k)) {
            return;
        }
        seen.add(k);
        out.push({
            id,
            name: normalizeCourseId(opt.name || id),
            code: normalizeCourseId(opt.code || id),
        });
    };
    template.forEach(add);
    for (const s of savedYearLevelIds) {
        add({ id: s, name: s, code: s });
    }
    return out.sort((a, b) => a.name.localeCompare(b.name));
}

/** Map stored JSON values onto one canonical label per program (e.g. keep “… Program”). */
export function alignCourseIdsToCanonical(
    saved: string[],
    template: CourseYearOption[],
): string[] {
    const merged = mergeAndDedupeCourses(template, saved);
    const baseToId = new Map<string, string>();
    for (const m of merged) {
        const id = normalizeCourseId(m.id);
        const base = courseBaseKey(id);
        baseToId.set(base, id);
    }
    const out = new Set<string>();
    for (const raw of saved) {
        const id = normalizeCourseId(raw);
        if (!id) {
            continue;
        }
        const base = courseBaseKey(id);
        const canon = baseToId.get(base);
        if (canon) {
            out.add(canon);
        }
    }
    return Array.from(out);
}

/** Dedupe raw course strings for read-only badges (view modal, etc.). */
export function uniqueCourseStringsForDisplay(courseIds: string[]): string[] {
    const rows = courseIds.map((id) => ({
        id: normalizeCourseId(id),
        name: normalizeCourseId(id),
        code: normalizeCourseId(id),
    })).filter((r) => r.id.length > 0);
    return dedupeCourseRows(rows).map((r) => r.id);
}

export function alignYearLevelIdsToCanonical(
    saved: string[],
    template: CourseYearOption[],
): string[] {
    const merged = mergeAndDedupeYearLevels(template, saved);
    const keyToId = new Map<string, string>();
    for (const m of merged) {
        const id = normalizeCourseId(m.id);
        keyToId.set(id.toLowerCase(), id);
    }
    const out = new Set<string>();
    for (const raw of saved) {
        const id = normalizeCourseId(raw);
        if (!id) {
            continue;
        }
        const canon = keyToId.get(id.toLowerCase());
        if (canon) {
            out.add(canon);
        }
    }
    return Array.from(out);
}
