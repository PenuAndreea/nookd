import type { StatsSession } from '@/api/stats';
import { daysForRange, sessionsInRange, startOfRange, summarize } from '@/lib/stats';

const NOW = new Date(2026, 8, 5, 18, 0);

function session(daysAgo: number, overrides: Partial<StatsSession> = {}): StatsSession {
    const date = new Date(2026, 8, 5 - daysAgo, 12, 0);

    return {
        id: `session-${daysAgo}`,
        created_at: date.toISOString(),
        ended_at: date.toISOString(),
        duration_minutes: 30,
        ended_reason: 'left',
        mood: null,
        page_reached: null,
        thoughts: null,
        room_id: 'room-1',
        room_name: 'Rainy Library',
        room_vibe: 'quiet_company',
        book_id: null,
        reflection_prompted_at: null,
        book: null,
        ...overrides,
    };
}

describe('startOfRange / daysForRange', () => {
    it('is a trailing window ending today, inclusive of both ends', () => {
        // 7 buckets means 6 days back, not 7 — otherwise the chart shows 8 days.
        expect(startOfRange('week', NOW).toDateString())
            .toBe(new Date(2026, 7, 30).toDateString());
        expect(daysForRange('week')).toBe(7);
    });

    it('widens for month and year', () => {
        expect(daysForRange('month')).toBe(30);
        expect(daysForRange('year')).toBe(365);
    });
});

describe('sessionsInRange', () => {
    it('keeps sessions inside the window and drops older ones', () => {
        const sessions = [session(0), session(3), session(20)];

        expect(sessionsInRange(sessions, 'week', NOW)).toHaveLength(2);
        expect(sessionsInRange(sessions, 'month', NOW)).toHaveLength(3);
    });

    it('includes a session from the first day of the window', () => {
        expect(sessionsInRange([session(6)], 'week', NOW)).toHaveLength(1);
        expect(sessionsInRange([session(7)], 'week', NOW)).toHaveLength(0);
    });

    it('ignores an unparseable timestamp instead of throwing', () => {
        expect(sessionsInRange([session(0, { created_at: 'nonsense' })], 'week', NOW)).toEqual([]);
    });
});

describe('summarize', () => {
    it('applies the sub-minute floor once, for every statistic', () => {
        const summary = summarize([session(0), session(1, { duration_minutes: 0 })], 'week', NOW);

        expect(summary.sessionCount).toBe(1);
        expect(summary.totalMinutes).toBe(30);
        expect(summary.daysRead).toBe(1);
    });

    it('counts a short session the reader reflected on', () => {
        // Reported from the simulator: a 12-second session with a mood and a
        // page recorded contributed to nothing at all.
        const summary = summarize(
            [session(0, { duration_minutes: 0, mood: 'focused', page_reached: 10 })],
            'week',
            NOW
        );

        expect(summary.sessionCount).toBe(1);
        expect(summary.moods).toEqual([{ mood: 'focused', count: 1, share: 1 }]);
    });

    it('sizes the day chart to the range being shown', () => {
        expect(summarize([], 'week', NOW).byDay).toHaveLength(7);
        expect(summarize([], 'month', NOW).byDay).toHaveLength(30);
    });

    it('returns a complete, zeroed summary for a reader with no sessions', () => {
        // The empty state renders from this, so nothing may be NaN or undefined.
        const summary = summarize([], 'week', NOW);

        expect(summary.totalMinutes).toBe(0);
        expect(summary.averageSessionMinutes).toBe(0);
        expect(summary.longestSessionMinutes).toBe(0);
        expect(summary.currentStreak).toBe(0);
        expect(summary.longestStreak).toBe(0);
        expect(summary.pagesRead).toBe(0);
        expect(summary.booksReadCount).toBe(0);
        expect(summary.unattributedMinutes).toBe(0);
        expect(summary.busiestHour).toBeNull();
        expect(summary.books).toEqual([]);
        expect(summary.moods).toEqual([]);
        expect(summary.vibes).toEqual([]);
        expect(summary.byWeekday).toHaveLength(7);
    });

    it('composes time, book and habit statistics from one pass', () => {
        const book = {
            id: 'book-1', title: 'Klara and the Sun', author: 'Kazuo Ishiguro',
            cover_url: null, page_count: 303,
        };
        const summary = summarize(
            [
                session(0, { duration_minutes: 40, book_id: 'book-1', book, page_reached: 100, mood: 'focused' }),
                session(1, { duration_minutes: 20, book_id: 'book-1', book, page_reached: 60 }),
                session(2, { duration_minutes: 25 }),
            ],
            'week',
            NOW
        );

        expect(summary.totalMinutes).toBe(85);
        expect(summary.books[0].minutes).toBe(60);
        // 60 -> 100 across two sessions on the same book.
        expect(summary.pagesRead).toBe(40);
        // The bookless session's time is still real reading time.
        expect(summary.unattributedMinutes).toBe(25);
        expect(summary.currentStreak).toBe(3);
        expect(summary.moods).toEqual([{ mood: 'focused', count: 1, share: 1 }]);
    });

    it('per-book minutes plus unattributed equals the total', () => {
        const book = { id: 'b', title: 'B', author: null, cover_url: null, page_count: null };
        const summary = summarize(
            [session(0, { book_id: 'b', book }), session(1), session(2, { book_id: 'b', book })],
            'week',
            NOW
        );
        const attributed = summary.books.reduce((sum, stat) => sum + stat.minutes, 0);

        expect(attributed + summary.unattributedMinutes).toBe(summary.totalMinutes);
    });
});
