import {
    completionRate,
    currentStreak,
    longestStreak,
    minutesByWeekday,
    moodBreakdown,
    readDayKeys,
    reflectionRate,
    vibeBreakdown,
    type HabitSessionLike,
} from '@/lib/stats-habits';

const NOW = new Date(2026, 8, 5, 18, 0); // Sat 5 Sep 2026, local

function session(
    date: Date,
    overrides: Partial<HabitSessionLike> = {}
): HabitSessionLike {
    return {
        created_at: date.toISOString(),
        duration_minutes: 30,
        mood: null,
        thoughts: null,
        ended_reason: 'left',
        room_vibe: null,
        ...overrides,
    };
}

/** `daysAgo` days before NOW, at midday so it cannot drift across midnight. */
function daysAgo(days: number, overrides: Partial<HabitSessionLike> = {}): HabitSessionLike {
    const date = new Date(2026, 8, 5 - days, 12, 0);
    return session(date, overrides);
}

describe('readDayKeys', () => {
    it('collapses several sessions on one day to a single key', () => {
        const keys = readDayKeys([
            session(new Date(2026, 8, 5, 9)),
            session(new Date(2026, 8, 5, 22)),
        ]);

        expect(keys.size).toBe(1);
        expect([...keys]).toEqual(['2026-09-05']);
    });
});

describe('currentStreak', () => {
    it('counts consecutive days ending today', () => {
        expect(currentStreak([daysAgo(0), daysAgo(1), daysAgo(2)], NOW)).toBe(3);
    });

    it('still counts a streak that ends yesterday', () => {
        // You have not read *yet* today — the streak is alive, and saying
        // otherwise every morning would be the opposite of encouraging.
        expect(currentStreak([daysAgo(1), daysAgo(2)], NOW)).toBe(2);
    });

    it('breaks on a one-day gap', () => {
        // Read 3 and 4 days ago, nothing since.
        expect(currentStreak([daysAgo(3), daysAgo(4)], NOW)).toBe(0);
    });

    it('does not double-count two sessions on the same day', () => {
        const twiceToday = [
            session(new Date(2026, 8, 5, 9)),
            session(new Date(2026, 8, 5, 21)),
        ];

        expect(currentStreak(twiceToday, NOW)).toBe(1);
    });

    it('spans a month boundary', () => {
        // 1 Sep, 31 Aug, 30 Aug ... up to today.
        const days = [0, 1, 2, 3, 4, 5, 6].map((offset) => daysAgo(offset));

        expect(currentStreak(days, NOW)).toBe(7);
    });

    it('is zero with no sessions', () => {
        expect(currentStreak([], NOW)).toBe(0);
    });
});

describe('longestStreak', () => {
    it('finds the longest run anywhere in the range', () => {
        // A 3-day run a while back, a 2-day run recently.
        const sessions = [daysAgo(0), daysAgo(1), daysAgo(10), daysAgo(11), daysAgo(12)];

        expect(longestStreak(sessions)).toBe(3);
    });

    it('is 1 when no two days are adjacent', () => {
        expect(longestStreak([daysAgo(0), daysAgo(5), daysAgo(10)])).toBe(1);
    });

    it('is zero with no sessions', () => {
        expect(longestStreak([])).toBe(0);
    });
});

describe('minutesByWeekday', () => {
    it('always returns seven buckets, Monday first', () => {
        const buckets = minutesByWeekday([]);

        expect(buckets).toHaveLength(7);
        expect(buckets.map((bucket) => bucket.weekday)).toEqual([0, 1, 2, 3, 4, 5, 6]);
    });

    it('puts a Sunday session in the last bucket, not the first', () => {
        // 6 Sep 2026 is a Sunday. getDay() calls that 0; Monday-first is 6.
        const buckets = minutesByWeekday([session(new Date(2026, 8, 6, 12))]);

        expect(buckets[6].sessions).toBe(1);
        expect(buckets[0].sessions).toBe(0);
    });

    it('puts a Monday session in the first bucket', () => {
        const buckets = minutesByWeekday([session(new Date(2026, 8, 7, 12))]);

        expect(buckets[0].sessions).toBe(1);
    });
});

describe('moodBreakdown', () => {
    it('orders by frequency and shares sum to 1', () => {
        const sessions = [
            daysAgo(0, { mood: 'focused' }),
            daysAgo(1, { mood: 'focused' }),
            daysAgo(2, { mood: 'cozy' }),
        ];

        const moods = moodBreakdown(sessions);

        expect(moods[0]).toEqual({ mood: 'focused', count: 2, share: 2 / 3 });
        expect(moods.reduce((sum, mood) => sum + mood.share, 0)).toBeCloseTo(1);
    });

    it('leaves sessions with no mood out of the denominator', () => {
        // A skipped reflection is not a neutral mood; counting it would make
        // every share meaningless.
        const moods = moodBreakdown([daysAgo(0, { mood: 'cozy' }), daysAgo(1)]);

        expect(moods).toEqual([{ mood: 'cozy', count: 1, share: 1 }]);
    });

    it('is empty when nothing recorded a mood', () => {
        expect(moodBreakdown([daysAgo(0)])).toEqual([]);
    });
});

describe('reflectionRate', () => {
    it('counts a session with either a mood or thoughts', () => {
        const sessions = [
            daysAgo(0, { mood: 'cozy' }),
            daysAgo(1, { thoughts: 'lovely chapter' }),
            daysAgo(2),
            daysAgo(3),
        ];

        expect(reflectionRate(sessions)).toBe(0.5);
    });

    it('does not count empty thoughts as a reflection', () => {
        expect(reflectionRate([daysAgo(0, { thoughts: '' })])).toBe(0);
    });

    it('is zero for no sessions', () => {
        expect(reflectionRate([])).toBe(0);
    });
});

describe('completionRate', () => {
    it('is the share of finishable sessions seen through to the end', () => {
        const sessions = [
            daysAgo(0, { ended_reason: 'completed' }),
            daysAgo(1, { ended_reason: 'left' }),
            daysAgo(2, { ended_reason: 'left' }),
            daysAgo(3, { ended_reason: 'completed' }),
        ];

        expect(completionRate(sessions)).toBe(0.5);
    });

    it('ignores orphaned sessions, which say nothing about intent', () => {
        const sessions = [
            daysAgo(0, { ended_reason: 'completed' }),
            daysAgo(1, { ended_reason: 'orphaned' }),
        ];

        expect(completionRate(sessions)).toBe(1);
    });

    it('is zero when nothing could be completed', () => {
        expect(completionRate([])).toBe(0);
        expect(completionRate([daysAgo(0, { ended_reason: 'orphaned' })])).toBe(0);
    });
});

describe('vibeBreakdown', () => {
    it('sums minutes by vibe, most first, with shares summing to 1', () => {
        const sessions = [
            daysAgo(0, { room_vibe: 'quiet_company', duration_minutes: 60 }),
            daysAgo(1, { room_vibe: 'fantasy', duration_minutes: 20 }),
            daysAgo(2, { room_vibe: 'quiet_company', duration_minutes: 20 }),
        ];

        const vibes = vibeBreakdown(sessions);

        expect(vibes[0]).toEqual({ vibe: 'quiet_company', minutes: 80, sessions: 2, share: 0.8 });
        expect(vibes.reduce((sum, vibe) => sum + vibe.share, 0)).toBeCloseTo(1);
    });

    it('excludes sessions with no vibe recorded', () => {
        expect(vibeBreakdown([daysAgo(0)])).toEqual([]);
    });
});
