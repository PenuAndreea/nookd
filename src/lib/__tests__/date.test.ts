import {
    addDays,
    daysBetween,
    eachLocalDay,
    localDayKey,
    localMonthKey,
    parsePgTimestamp,
    splitDuration,
    startOfLocalDay,
    startOfLocalMonth,
    startOfLocalWeek,
    startOfLocalYear,
} from '@/lib/date';

describe('parsePgTimestamp', () => {
    it('parses a Postgres timestamp with microsecond precision', () => {
        // Hermes only reliably parses milliseconds, so the extra digits must go.
        const withMicros = parsePgTimestamp('2026-09-05T10:00:00.123456+00:00');
        const withMillis = Date.parse('2026-09-05T10:00:00.123+00:00');

        expect(withMicros).toBe(withMillis);
    });

    it('parses a timestamp that has no fractional seconds', () => {
        expect(parsePgTimestamp('2026-09-05T10:00:00+00:00'))
            .toBe(Date.parse('2026-09-05T10:00:00+00:00'));
    });

    it('returns null rather than NaN for missing or unparseable input', () => {
        expect(parsePgTimestamp(null)).toBeNull();
        expect(parsePgTimestamp(undefined)).toBeNull();
        expect(parsePgTimestamp('')).toBeNull();
        expect(parsePgTimestamp('not a date')).toBeNull();
    });
});

describe('localDayKey', () => {
    it('uses the local calendar day, not the UTC one', () => {
        // 00:30 local on the 5th. toISOString() would report the 4th for any
        // timezone ahead of UTC — that is the bug this guards against.
        const justAfterMidnight = new Date(2026, 8, 5, 0, 30);

        expect(localDayKey(justAfterMidnight)).toBe('2026-09-05');
    });

    it('still reports the same day late at night', () => {
        expect(localDayKey(new Date(2026, 8, 5, 23, 45))).toBe('2026-09-05');
    });

    it('zero-pads single-digit months and days', () => {
        expect(localDayKey(new Date(2026, 0, 3))).toBe('2026-01-03');
    });
});

describe('localMonthKey', () => {
    it('formats as YYYY-MM', () => {
        expect(localMonthKey(new Date(2026, 8, 5))).toBe('2026-09');
        expect(localMonthKey(new Date(2026, 11, 31, 23, 59))).toBe('2026-12');
    });
});

describe('startOf helpers', () => {
    it('startOfLocalDay strips the time', () => {
        const start = startOfLocalDay(new Date(2026, 8, 5, 17, 42, 9, 500));

        expect(start.getHours()).toBe(0);
        expect(start.getMinutes()).toBe(0);
        expect(start.getSeconds()).toBe(0);
        expect(start.getMilliseconds()).toBe(0);
        expect(localDayKey(start)).toBe('2026-09-05');
    });

    it('startOfLocalWeek returns the Monday for a mid-week day', () => {
        // 2026-09-05 is a Saturday.
        expect(localDayKey(startOfLocalWeek(new Date(2026, 8, 5)))).toBe('2026-08-31');
    });

    it('startOfLocalWeek returns the *previous* Monday for a Sunday', () => {
        // Sunday must not start its own week — the off-by-one in a
        // Sunday-first getDay().
        expect(localDayKey(startOfLocalWeek(new Date(2026, 8, 6)))).toBe('2026-08-31');
    });

    it('startOfLocalWeek is a no-op on a Monday', () => {
        expect(localDayKey(startOfLocalWeek(new Date(2026, 8, 7)))).toBe('2026-09-07');
    });

    it('startOfLocalMonth and startOfLocalYear', () => {
        expect(localDayKey(startOfLocalMonth(new Date(2026, 8, 17)))).toBe('2026-09-01');
        expect(localDayKey(startOfLocalYear(new Date(2026, 8, 17)))).toBe('2026-01-01');
    });

    it('does not mutate the date it is given', () => {
        const original = new Date(2026, 8, 17, 12, 0);
        startOfLocalMonth(original);

        expect(localDayKey(original)).toBe('2026-09-17');
        expect(original.getHours()).toBe(12);
    });
});

describe('addDays / eachLocalDay / daysBetween', () => {
    it('addDays crosses a month boundary', () => {
        expect(localDayKey(addDays(new Date(2026, 8, 30), 1))).toBe('2026-10-01');
    });

    it('addDays goes backwards across a year boundary', () => {
        expect(localDayKey(addDays(new Date(2026, 0, 1), -1))).toBe('2025-12-31');
    });

    it('eachLocalDay is inclusive of both ends', () => {
        const days = eachLocalDay(new Date(2026, 8, 1), new Date(2026, 8, 7));

        expect(days).toHaveLength(7);
        expect(localDayKey(days[0])).toBe('2026-09-01');
        expect(localDayKey(days[6])).toBe('2026-09-07');
    });

    it('eachLocalDay returns a single day when start and end match', () => {
        expect(eachLocalDay(new Date(2026, 8, 5, 9), new Date(2026, 8, 5, 21))).toHaveLength(1);
    });

    it('eachLocalDay returns nothing when end precedes start', () => {
        expect(eachLocalDay(new Date(2026, 8, 5), new Date(2026, 8, 1))).toEqual([]);
    });

    it('eachLocalDay spans a month boundary with no gaps or repeats', () => {
        const days = eachLocalDay(new Date(2026, 7, 30), new Date(2026, 8, 2));

        expect(days.map(localDayKey))
            .toEqual(['2026-08-30', '2026-08-31', '2026-09-01', '2026-09-02']);
    });

    it('daysBetween ignores the time of day', () => {
        expect(daysBetween(new Date(2026, 8, 5, 23, 59), new Date(2026, 8, 6, 0, 1))).toBe(1);
        expect(daysBetween(new Date(2026, 8, 5, 1), new Date(2026, 8, 5, 23))).toBe(0);
    });

    it('daysBetween is negative when the second date is earlier', () => {
        expect(daysBetween(new Date(2026, 8, 6), new Date(2026, 8, 5))).toBe(-1);
    });
});

describe('splitDuration', () => {
    it('splits minutes into hours and minutes', () => {
        expect(splitDuration(0)).toEqual({ hours: 0, minutes: 0 });
        expect(splitDuration(45)).toEqual({ hours: 0, minutes: 45 });
        expect(splitDuration(60)).toEqual({ hours: 1, minutes: 0 });
        expect(splitDuration(185)).toEqual({ hours: 3, minutes: 5 });
    });

    it('clamps a negative total to zero rather than showing "-1h -30m"', () => {
        expect(splitDuration(-90)).toEqual({ hours: 0, minutes: 0 });
    });
});
