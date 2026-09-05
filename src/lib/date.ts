/**
 * Local-time date helpers. No date library is installed and none is being
 * added, so everything here is hand-rolled — deliberately, since the only
 * demanding part is bucketing, and bucketing has one rule:
 *
 * **`toISOString()` must never appear in a bucketing path.** It converts to
 * UTC, which silently reassigns an early-morning timestamp to the previous day
 * for anyone east of Greenwich. Every key below is built from the local
 * getFullYear/getMonth/getDate triple instead.
 */

/**
 * Milliseconds for a Postgres timestamp, or null if it cannot be parsed.
 *
 * Postgres emits microsecond precision (`...T10:00:00.123456+00`) and Hermes
 * only reliably parses milliseconds, so the extra digits are trimmed first.
 * This was duplicated in useElapsedSeconds and the Rooms screen; a third copy
 * is how it eventually gets fixed in only two of three places.
 */
export function parsePgTimestamp(value: string | null | undefined): number | null {
    if (!value) return null;

    const ms = Date.parse(value.replace(/(\.\d{3})\d+/, '$1'));
    return Number.isNaN(ms) ? null : ms;
}

export function startOfLocalDay(date: Date): Date {
    const start = new Date(date);
    start.setHours(0, 0, 0, 0);
    return start;
}

/** `YYYY-MM-DD` in the device's own timezone. The bucket key for day charts. */
export function localDayKey(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

/** `YYYY-MM` in the device's own timezone. */
export function localMonthKey(date: Date): string {
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
}

/** Monday-first, matching how the weekday chart is labelled. */
export function startOfLocalWeek(date: Date): Date {
    const start = startOfLocalDay(date);
    // getDay() is Sunday-first (0=Sun); shift so Monday is 0.
    const daysSinceMonday = (start.getDay() + 6) % 7;
    start.setDate(start.getDate() - daysSinceMonday);
    return start;
}

export function startOfLocalMonth(date: Date): Date {
    const start = startOfLocalDay(date);
    start.setDate(1);
    return start;
}

export function startOfLocalYear(date: Date): Date {
    const start = startOfLocalMonth(date);
    start.setMonth(0);
    return start;
}

/**
 * `days` calendar days added. Uses setDate rather than adding 86_400_000 ms so
 * a 23- or 25-hour DST day still moves exactly one day.
 */
export function addDays(date: Date, days: number): Date {
    const next = new Date(date);
    next.setDate(next.getDate() + days);
    return next;
}

/**
 * One entry per calendar day from `start` to `end`, inclusive, oldest first.
 * DST-safe for the same reason as addDays.
 */
export function eachLocalDay(start: Date, end: Date): Date[] {
    const days: Date[] = [];
    let cursor = startOfLocalDay(start);
    const last = startOfLocalDay(end);

    while (cursor.getTime() <= last.getTime()) {
        days.push(cursor);
        cursor = addDays(cursor, 1);
    }

    return days;
}

/** Whole calendar days between two instants, ignoring the time of day. */
export function daysBetween(a: Date, b: Date): number {
    const from = startOfLocalDay(a).getTime();
    const to = startOfLocalDay(b).getTime();
    // Round rather than floor: a DST boundary makes the span 23 or 25 hours.
    return Math.round((to - from) / 86_400_000);
}

/** Splits minutes for display. The caller formats through i18n. */
export function splitDuration(totalMinutes: number): { hours: number; minutes: number } {
    const safe = Math.max(Math.round(totalMinutes), 0);
    return { hours: Math.floor(safe / 60), minutes: safe % 60 };
}
