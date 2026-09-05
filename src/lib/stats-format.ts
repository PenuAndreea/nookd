import { daysBetween, splitDuration } from '@/lib/date';

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

const MONTH_KEYS = [
    'jan', 'feb', 'mar', 'apr', 'may', 'jun',
    'jul', 'aug', 'sep', 'oct', 'nov', 'dec',
] as const;

/**
 * A short date like "5 Sep", or "Today" / "Yesterday" for the recent ones.
 *
 * Hand-built for the same reason as `partOfDayKey`: Hermes ships a cut-down
 * Intl, so `toLocaleDateString` is not dependable here. Month names come from
 * the same i18n group the year chart labels its bars with.
 */
export function formatShortDate(date: Date, t: Translate, now: Date = new Date()): string {
    const days = daysBetween(date, now);

    if (days === 0) return t('you.journal.today');
    if (days === 1) return t('you.journal.yesterday');

    const month = t(`you.habits.months.${MONTH_KEYS[date.getMonth()]}`);
    const sameYear = date.getFullYear() === now.getFullYear();

    return sameYear
        ? t('you.journal.date', { day: date.getDate(), month })
        : t('you.journal.dateWithYear', { day: date.getDate(), month, year: date.getFullYear() });
}

/**
 * The same instant as a phrase that can sit inside a sentence: "today",
 * "yesterday", "on 5 Sep". `formatShortDate` is the standalone label for a
 * list; this is the one to interpolate.
 */
export function formatWhen(date: Date, t: Translate, now: Date = new Date()): string {
    const days = daysBetween(date, now);

    if (days === 0) return t('you.pendingReflection.whenToday');
    if (days === 1) return t('you.pendingReflection.whenYesterday');

    return t('you.pendingReflection.whenOn', { date: formatShortDate(date, t, now) });
}
