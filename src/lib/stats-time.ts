import {
    addDays,
    localDayKey,
    localMonthKey,
    parsePgTimestamp,
    startOfLocalDay,
    startOfLocalMonth,
} from '@/lib/date';

/**
 * The shape the time aggregators need. Kept structural rather than importing
 * StatsSession so these stay pure functions over plain data, trivially
 * testable without building a whole session row.
 */
export interface SessionLike {
    created_at: string;
    duration_minutes: number | null;
    /** Present on real sessions; the floor below uses them when they are. */
    mood?: string | null;
    thoughts?: string | null;
    page_reached?: number | null;
}

export interface DayBucket {
    /** `YYYY-MM-DD` for a daily bucket, `YYYY-MM` for a monthly one. */
    key: string;
    /** The first instant of the bucket, for labelling. */
    date: Date;
    minutes: number;
    sessions: number;
}

/**
 * Sessions shorter than this are dropped from every statistic.
 *
 * Tapping into a room and straight back out produces a real row, but calling
 * it a reading session would drag the average down and inflate the count.
 * `close_reading_session` rounds to whole minutes, so a genuine bounce lands on
 * 0 and is excluded here by construction.
 */
export const MIN_SESSION_MINUTES = 1;

/** Whether the reader recorded anything about this session themselves. */
function hasReflection(session: SessionLike): boolean {
    return session.mood != null
        || (session.thoughts ?? '') !== ''
        || session.page_reached != null;
}

/**
 * Whether a session belongs in the statistics.
 *
 * The length floor is about discarding accidental bounces — but a bounce does
 * not come with a mood, a page, or written thoughts. A reader who stopped to
 * reflect meant that session, however short it was, and silently dropping it
 * throws away the one thing they actually typed. So a reflected session always
 * counts.
 */
export function countsTowardStats(session: SessionLike): boolean {
    if (hasReflection(session)) return true;

    return (session.duration_minutes ?? 0) >= MIN_SESSION_MINUTES;
}

export function totalMinutes(sessions: SessionLike[]): number {
    return sessions.reduce((sum, session) => sum + (session.duration_minutes ?? 0), 0);
}

export function sessionCount(sessions: SessionLike[]): number {
    return sessions.length;
}

/** Rounded to a whole minute. 0 for no sessions, never NaN. */
export function averageSessionMinutes(sessions: SessionLike[]): number {
    if (sessions.length === 0) return 0;
    return Math.round(totalMinutes(sessions) / sessions.length);
}

export function longestSessionMinutes(sessions: SessionLike[]): number {
    return sessions.reduce(
        (longest, session) => Math.max(longest, session.duration_minutes ?? 0),
        0
    );
}

/**
 * `days` buckets ending today, oldest first, zero-filled so a chart has no
 * gaps and a quiet day reads as a quiet day rather than vanishing.
 */
export function minutesByDay(
    sessions: SessionLike[],
    days: number,
    now: Date = new Date()
): DayBucket[] {
    const buckets = new Map<string, DayBucket>();
    const firstDay = addDays(startOfLocalDay(now), -(days - 1));

    for (let offset = 0; offset < days; offset += 1) {
        const date = addDays(firstDay, offset);
        buckets.set(localDayKey(date), { key: localDayKey(date), date, minutes: 0, sessions: 0 });
    }

    for (const session of sessions) {
        const ms = parsePgTimestamp(session.created_at);
        if (ms === null) continue;

        const bucket = buckets.get(localDayKey(new Date(ms)));
        // Outside the window entirely — the caller fetched a wider range than
        // it is charting.
        if (!bucket) continue;

        bucket.minutes += session.duration_minutes ?? 0;
        bucket.sessions += 1;
    }

    return [...buckets.values()];
}

/**
 * `months` buckets ending this month, oldest first, zero-filled.
 *
 * A year cannot be charted a day at a time: 365 bars in a phone's width leaves
 * each one well under a pixel, so the chart renders as an empty gap. Months
 * are the readable unit at that range.
 */
export function minutesByMonth(
    sessions: SessionLike[],
    months: number,
    now: Date = new Date()
): DayBucket[] {
    const buckets = new Map<string, DayBucket>();
    const first = startOfLocalMonth(now);
    first.setMonth(first.getMonth() - (months - 1));

    for (let offset = 0; offset < months; offset += 1) {
        const date = new Date(first);
        date.setMonth(date.getMonth() + offset);
        buckets.set(localMonthKey(date), {
            key: localMonthKey(date), date, minutes: 0, sessions: 0,
        });
    }

    for (const session of sessions) {
        const ms = parsePgTimestamp(session.created_at);
        if (ms === null) continue;

        const bucket = buckets.get(localMonthKey(new Date(ms)));
        if (!bucket) continue;

        bucket.minutes += session.duration_minutes ?? 0;
        bucket.sessions += 1;
    }

    return [...buckets.values()];
}

/** Which hour of the day (0–23) the reader starts most of their sessions in. */
export function busiestHour(sessions: SessionLike[]): number | null {
    if (sessions.length === 0) return null;

    const byHour = new Array<number>(24).fill(0);
    let counted = 0;

    for (const session of sessions) {
        const ms = parsePgTimestamp(session.created_at);
        if (ms === null) continue;
        byHour[new Date(ms).getHours()] += 1;
        counted += 1;
    }

    if (counted === 0) return null;

    return byHour.indexOf(Math.max(...byHour));
}
