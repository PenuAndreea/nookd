import type { StatsSession } from '@/api/stats';
import { addDays, parsePgTimestamp, startOfLocalDay } from '@/lib/date';
import {
    bookBreakdown,
    booksReadCount,
    pagesRead,
    unattributedMinutes,
    type BookStat,
} from '@/lib/stats-books';
import {
    completionRate,
    currentStreak,
    longestStreak,
    minutesByWeekday,
    moodBreakdown,
    readDayKeys,
    reflectionRate,
    vibeBreakdown,
    type MoodStat,
    type VibeStat,
    type WeekdayBucket,
} from '@/lib/stats-habits';
import {
    averageSessionMinutes,
    busiestHour,
    countsTowardStats,
    longestSessionMinutes,
    minutesByDay,
    sessionCount,
    totalMinutes,
    type DayBucket,
} from '@/lib/stats-time';

export type StatsRange = 'week' | 'month' | 'year';

/**
 * Each range is a rolling window of this many days, ending today.
 *
 * Rolling rather than calendar-based on purpose: a calendar range and a
 * fixed-size chart disagree with each other, so on 3 January "this year" would
 * filter to three days of sessions and then draw them across 365 buckets. A
 * trailing window keeps the filter and the chart describing the same thing all
 * year round.
 */
const RANGE_DAYS: Record<StatsRange, number> = { week: 7, month: 30, year: 365 };

export interface ReadingSummary {
    totalMinutes: number;
    sessionCount: number;
    averageSessionMinutes: number;
    longestSessionMinutes: number;
    busiestHour: number | null;
    byDay: DayBucket[];

    books: BookStat[];
    booksReadCount: number;
    pagesRead: number;
    unattributedMinutes: number;

    currentStreak: number;
    longestStreak: number;
    daysRead: number;
    byWeekday: WeekdayBucket[];
    moods: MoodStat[];
    reflectionRate: number;
    completionRate: number;
    vibes: VibeStat[];
}

/** Midnight local on the first day of the range, inclusive. */
export function startOfRange(range: StatsRange, now: Date = new Date()): Date {
    return addDays(startOfLocalDay(now), -(RANGE_DAYS[range] - 1));
}

/**
 * Narrows a year's worth of fetched sessions to one range.
 *
 * The hook fetches once and slices here, so switching range is instant and
 * works offline rather than costing a round trip each time.
 */
export function sessionsInRange(
    sessions: StatsSession[],
    range: StatsRange,
    now: Date = new Date()
): StatsSession[] {
    const from = startOfRange(range, now).getTime();

    return sessions.filter((session) => {
        const ms = parsePgTimestamp(session.created_at);
        return ms !== null && ms >= from;
    });
}

/**
 * Every number the You tab shows, from one pass over the sessions.
 *
 * The sub-minute floor is applied here and only here, so the API layer stays a
 * faithful reader of what happened while the policy about what counts as a
 * reading session lives with the statistics.
 */
export function summarize(
    sessions: StatsSession[],
    range: StatsRange = 'week',
    now: Date = new Date()
): ReadingSummary {
    const counted = sessions.filter(countsTowardStats);

    return {
        totalMinutes: totalMinutes(counted),
        sessionCount: sessionCount(counted),
        averageSessionMinutes: averageSessionMinutes(counted),
        longestSessionMinutes: longestSessionMinutes(counted),
        busiestHour: busiestHour(counted),
        byDay: minutesByDay(counted, RANGE_DAYS[range], now),

        books: bookBreakdown(counted),
        booksReadCount: booksReadCount(counted),
        pagesRead: pagesRead(counted),
        unattributedMinutes: unattributedMinutes(counted),

        currentStreak: currentStreak(counted, now),
        longestStreak: longestStreak(counted),
        daysRead: readDayKeys(counted).size,
        byWeekday: minutesByWeekday(counted),
        moods: moodBreakdown(counted),
        reflectionRate: reflectionRate(counted),
        completionRate: completionRate(counted),
        vibes: vibeBreakdown(counted),
    };
}

/** Chart bucket count for a range, so the screen and the summary agree. */
export function daysForRange(range: StatsRange): number {
    return RANGE_DAYS[range];
}
