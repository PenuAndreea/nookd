import { splitDuration } from '@/lib/date';

type Translate = (key: string, options?: Record<string, unknown>) => string;

/**
 * A minute count as display text: "45m", "2h", "1h 20m".
 *
 * Takes `t` as a parameter rather than calling a hook, matching how
 * greetingFor and timeInRoom are written on the Rooms screen — so it stays a
 * pure function that tests can call directly.
 */
export function formatMinutes(minutes: number, t: Translate): string {
    if (minutes <= 0) return t('you.time.none');

    const { hours, minutes: rest } = splitDuration(minutes);

    if (hours === 0) return t('you.time.minutesValue', { count: rest });
    if (rest === 0) return t('you.time.hoursValueWhole', { hours });

    return t('you.time.hoursValue', { hours, minutes: rest });
}

/** A 0–1 share as a whole percentage. */
export function formatPercent(share: number, t: Translate): string {
    return t('you.habits.percentValue', { percent: Math.round(share * 100) });
}

/**
 * An hour-of-day (0–23) as a part of the day.
 *
 * Deliberately not a clock time: Hermes ships a cut-down Intl, so
 * `toLocaleTimeString(undefined, { hour: 'numeric' })` renders a bare
 * zero-padded "00" rather than anything a reader would recognise. "in the
 * evening" is also the more useful statement — nobody reads at exactly 21:00.
 */
export function partOfDayKey(hour: number): 'morning' | 'afternoon' | 'evening' | 'night' {
    if (hour >= 5 && hour < 12) return 'morning';
    if (hour >= 12 && hour < 17) return 'afternoon';
    if (hour >= 17 && hour < 22) return 'evening';
    return 'night';
}
