import { addDays, daysBetween, localDayKey, parsePgTimestamp, startOfLocalDay } from '@/lib/date';
import type { SessionLike } from '@/lib/stats-time';

export interface HabitSessionLike extends SessionLike {
    mood: string | null;
    thoughts: string | null;
    ended_reason: string | null;
    room_vibe: string | null;
}

export interface MoodStat {
    mood: string;
    count: number;
    /** 0–1, out of sessions that recorded a mood. */
    share: number;
}

export interface WeekdayBucket {
    /** 0 = Monday, matching how the chart is labelled. */
    weekday: number;
    minutes: number;
    sessions: number;
}

export interface VibeStat {
    vibe: string;
    minutes: number;
    sessions: number;
    share: number;
}

/** The distinct local days a reader read on. The basis for streaks and heatmaps. */
export function readDayKeys(sessions: SessionLike[]): Set<string> {
    const keys = new Set<string>();

    for (const session of sessions) {
        const ms = parsePgTimestamp(session.created_at);
        if (ms === null) continue;
        keys.add(localDayKey(new Date(ms)));
    }

    return keys;
}

/**
 * Consecutive days read, counting back from today — or from yesterday if
 * today has no session yet.
 *
 * That grace matters: without it a reader's streak reads as broken every
 * morning until they open the app, which is exactly when a streak is supposed
 * to be encouraging them.
 */
export function currentStreak(sessions: SessionLike[], now: Date = new Date()): number {
    const days = readDayKeys(sessions);
    if (days.size === 0) return 0;

    const today = startOfLocalDay(now);
    const startedToday = days.has(localDayKey(today));
    if (!startedToday && !days.has(localDayKey(addDays(today, -1)))) return 0;

    let cursor = startedToday ? today : addDays(today, -1);
    let streak = 0;

    while (days.has(localDayKey(cursor))) {
        streak += 1;
        cursor = addDays(cursor, -1);
    }

    return streak;
}

/** The longest run of consecutive days read, anywhere in the range. */
export function longestStreak(sessions: SessionLike[]): number {
    const days = [...readDayKeys(sessions)].sort();
    if (days.length === 0) return 0;

    let longest = 1;
    let run = 1;

    for (let i = 1; i < days.length; i += 1) {
        const previous = new Date(`${days[i - 1]}T00:00:00`);
        const current = new Date(`${days[i]}T00:00:00`);

        run = daysBetween(previous, current) === 1 ? run + 1 : 1;
        longest = Math.max(longest, run);
    }

    return longest;
}

/** Seven buckets, Monday first, so the chart order never depends on the locale. */
export function minutesByWeekday(sessions: SessionLike[]): WeekdayBucket[] {
    const buckets: WeekdayBucket[] = Array.from({ length: 7 }, (_, weekday) => ({
        weekday,
        minutes: 0,
        sessions: 0,
    }));

    for (const session of sessions) {
        const ms = parsePgTimestamp(session.created_at);
        if (ms === null) continue;

        // getDay() is Sunday-first; shift so Monday is 0.
        const weekday = (new Date(ms).getDay() + 6) % 7;
        buckets[weekday].minutes += session.duration_minutes ?? 0;
        buckets[weekday].sessions += 1;
    }

    return buckets;
}

/**
 * How sessions felt, most common first. Sessions with no mood are left out of
 * the denominator entirely — a skipped reflection is not a neutral mood, and
 * counting it as one would make every share meaningless.
 */
export function moodBreakdown(sessions: HabitSessionLike[]): MoodStat[] {
    const counts = new Map<string, number>();

    for (const session of sessions) {
        if (!session.mood) continue;
        counts.set(session.mood, (counts.get(session.mood) ?? 0) + 1);
    }

    const withMood = [...counts.values()].reduce((sum, count) => sum + count, 0);
    if (withMood === 0) return [];

    return [...counts.entries()]
        .map(([mood, count]) => ({ mood, count, share: count / withMood }))
        .sort((a, b) => b.count - a.count);
}

/** 0–1: how often the reader actually writes a reflection. */
export function reflectionRate(sessions: HabitSessionLike[]): number {
    if (sessions.length === 0) return 0;

    const reflected = sessions.filter(
        (session) => session.mood != null || (session.thoughts ?? '') !== ''
    ).length;

    return reflected / sessions.length;
}

/**
 * 0–1: how often a timed room was seen through to its scheduled end.
 *
 * Only sessions in timed rooms count, which is what `ended_reason` makes
 * possible — 'completed' is a server-side verdict, so this cannot be gamed by
 * a client. Open-ended house rooms have nothing to complete and are excluded.
 */
export function completionRate(sessions: HabitSessionLike[]): number {
    const finishable = sessions.filter(
        (session) => session.ended_reason === 'completed' || session.ended_reason === 'left'
    );
    if (finishable.length === 0) return 0;

    return finishable.filter((session) => session.ended_reason === 'completed').length
        / finishable.length;
}

/**
 * Time by room vibe. Computed and tested now though nothing renders it yet —
 * the v2 rooms breakdown is a UI-only change on top of this.
 */
export function vibeBreakdown(sessions: HabitSessionLike[]): VibeStat[] {
    const byVibe = new Map<string, { minutes: number; sessions: number }>();

    for (const session of sessions) {
        if (!session.room_vibe) continue;
        const entry = byVibe.get(session.room_vibe) ?? { minutes: 0, sessions: 0 };
        entry.minutes += session.duration_minutes ?? 0;
        entry.sessions += 1;
        byVibe.set(session.room_vibe, entry);
    }

    const total = [...byVibe.values()].reduce((sum, entry) => sum + entry.minutes, 0);

    return [...byVibe.entries()]
        .map(([vibe, entry]) => ({
            vibe,
            minutes: entry.minutes,
            sessions: entry.sessions,
            share: total === 0 ? 0 : entry.minutes / total,
        }))
        .sort((a, b) => b.minutes - a.minutes);
}
