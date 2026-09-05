import {
    averageSessionMinutes,
    busiestHour,
    countsTowardStats,
    longestSessionMinutes,
    minutesByDay,
    sessionCount,
    totalMinutes,
    type SessionLike,
} from '@/lib/stats-time';

/** A session on a given local date/time, so bucketing is unambiguous. */
function at(year: number, month: number, day: number, hour = 10, minutes = 30): SessionLike {
    return {
        created_at: new Date(year, month - 1, day, hour).toISOString(),
        duration_minutes: minutes,
    };
}

const NOW = new Date(2026, 8, 5, 18, 0); // Sat 5 Sep 2026, local

describe('totals', () => {
    it('sums durations', () => {
        expect(totalMinutes([at(2026, 9, 1, 10, 20), at(2026, 9, 2, 10, 25)])).toBe(45);
    });

    it('treats a null duration as zero rather than producing NaN', () => {
        const sessions: SessionLike[] = [
            { created_at: NOW.toISOString(), duration_minutes: null },
            at(2026, 9, 1, 10, 30),
        ];

        expect(totalMinutes(sessions)).toBe(30);
        expect(Number.isNaN(totalMinutes(sessions))).toBe(false);
    });

    it('is zero for no sessions', () => {
        expect(totalMinutes([])).toBe(0);
        expect(sessionCount([])).toBe(0);
    });
});

describe('averageSessionMinutes', () => {
    it('is zero, not NaN, for no sessions', () => {
        expect(averageSessionMinutes([])).toBe(0);
    });

    it('rounds to a whole minute', () => {
        // 30 + 30 + 25 = 85 over 3 sessions = 28.33
        const sessions = [at(2026, 9, 1, 10, 30), at(2026, 9, 2, 10, 30), at(2026, 9, 3, 10, 25)];

        expect(averageSessionMinutes(sessions)).toBe(28);
    });
});

describe('longestSessionMinutes', () => {
    it('picks the maximum, not the most recent', () => {
        const sessions = [at(2026, 9, 1, 10, 90), at(2026, 9, 2, 10, 15)];

        expect(longestSessionMinutes(sessions)).toBe(90);
    });

    it('is zero for no sessions', () => {
        expect(longestSessionMinutes([])).toBe(0);
    });
});

describe('countsTowardStats', () => {
    const bounce = { created_at: NOW.toISOString(), duration_minutes: 0 };

    it('drops a sub-minute bounce into a room', () => {
        expect(countsTowardStats(bounce)).toBe(false);
        expect(countsTowardStats({ created_at: NOW.toISOString(), duration_minutes: null })).toBe(false);
    });

    it('keeps a session of a minute or more', () => {
        expect(countsTowardStats({ created_at: NOW.toISOString(), duration_minutes: 1 })).toBe(true);
    });

    it('keeps a short session the reader reflected on', () => {
        // The floor is for accidental bounces, and a bounce does not come with
        // a mood. Dropping this would discard the one thing the reader typed.
        expect(countsTowardStats({ ...bounce, mood: 'focused' })).toBe(true);
        expect(countsTowardStats({ ...bounce, thoughts: 'lovely opening' })).toBe(true);
        expect(countsTowardStats({ ...bounce, page_reached: 10 })).toBe(true);
    });

    it('still drops a short session with an empty reflection', () => {
        expect(countsTowardStats({ ...bounce, mood: null, thoughts: '' })).toBe(false);
    });
});

describe('minutesByDay', () => {
    it('returns exactly the requested number of buckets, oldest first', () => {
        const buckets = minutesByDay([], 7, NOW);

        expect(buckets).toHaveLength(7);
        expect(buckets[0].key).toBe('2026-08-30');
        expect(buckets[6].key).toBe('2026-09-05');
    });

    it('zero-fills quiet days rather than omitting them', () => {
        const buckets = minutesByDay([at(2026, 9, 5, 10, 40)], 7, NOW);

        expect(buckets.filter((bucket) => bucket.minutes === 0)).toHaveLength(6);
        expect(buckets[6].minutes).toBe(40);
        expect(buckets[6].sessions).toBe(1);
    });

    it('sums several sessions on the same local day into one bucket', () => {
        const buckets = minutesByDay(
            [at(2026, 9, 4, 9, 20), at(2026, 9, 4, 21, 35)],
            7,
            NOW
        );
        const thursday = buckets.find((bucket) => bucket.key === '2026-09-04');

        expect(thursday?.minutes).toBe(55);
        expect(thursday?.sessions).toBe(2);
    });

    it('buckets a late-night session on its own local day', () => {
        // 23:30 local. Bucketing via toISOString would push this to the next
        // day for anyone behind UTC and the previous day for anyone ahead.
        const buckets = minutesByDay([at(2026, 9, 3, 23, 30)], 7, NOW);

        expect(buckets.find((bucket) => bucket.key === '2026-09-03')?.minutes).toBe(30);
    });

    it('ignores sessions outside the window', () => {
        const buckets = minutesByDay([at(2026, 7, 1, 10, 60)], 7, NOW);

        expect(buckets.every((bucket) => bucket.minutes === 0)).toBe(true);
    });
});

describe('busiestHour', () => {
    it('finds the hour the reader starts most sessions in', () => {
        const sessions = [
            at(2026, 9, 1, 21), at(2026, 9, 2, 21), at(2026, 9, 3, 9),
        ];

        expect(busiestHour(sessions)).toBe(21);
    });

    it('is null when there is nothing to go on', () => {
        expect(busiestHour([])).toBeNull();
    });
});
