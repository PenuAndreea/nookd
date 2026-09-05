import i18n from '@/i18n';
import { formatMinutes, formatPercent, partOfDayKey } from '@/lib/stats-format';

// The real i18n instance, so a stale key fails here the way a reader would
// notice it.
const t = i18n.t.bind(i18n) as (key: string, options?: Record<string, unknown>) => string;

describe('formatMinutes', () => {
    it('shows minutes under an hour', () => {
        expect(formatMinutes(45, t)).toBe('45m');
    });

    it('shows whole hours without a trailing zero', () => {
        expect(formatMinutes(120, t)).toBe('2h');
    });

    it('shows hours and minutes together', () => {
        expect(formatMinutes(75, t)).toBe('1h 15m');
    });

    it('shows a dash rather than "0m" for no reading', () => {
        expect(formatMinutes(0, t)).toBe('—');
        expect(formatMinutes(-10, t)).toBe('—');
    });
});

describe('formatPercent', () => {
    it('rounds a share to a whole percentage', () => {
        expect(formatPercent(0.5, t)).toBe('50%');
        expect(formatPercent(2 / 3, t)).toBe('67%');
        expect(formatPercent(0, t)).toBe('0%');
    });
});

describe('partOfDayKey', () => {
    it('buckets the hour into a part of the day', () => {
        expect(partOfDayKey(7)).toBe('morning');
        expect(partOfDayKey(14)).toBe('afternoon');
        expect(partOfDayKey(21)).toBe('evening');
        expect(partOfDayKey(2)).toBe('night');
    });

    it('handles the boundaries, including midnight', () => {
        // Hermes renders hour 0 as a bare "00" through Intl, which is why this
        // is a phrase rather than a clock time at all.
        expect(partOfDayKey(0)).toBe('night');
        expect(partOfDayKey(5)).toBe('morning');
        expect(partOfDayKey(12)).toBe('afternoon');
        expect(partOfDayKey(17)).toBe('evening');
        expect(partOfDayKey(22)).toBe('night');
    });

    it('has real copy behind every bucket it can return', () => {
        for (const hour of [0, 7, 14, 21]) {
            const phrase = t(`you.time.partOfDay.${partOfDayKey(hour)}`);
            expect(phrase).not.toContain('you.time');
        }
    });
});
