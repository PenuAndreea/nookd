import type { SessionLike } from '@/lib/stats-time';

export interface BookSummary {
    id: string;
    title: string;
    author: string | null;
    cover_url: string | null;
    page_count: number | null;
}

export interface BookSessionLike extends SessionLike {
    book_id: string | null;
    /** The absolute page the reader reached. Kept for display, not for totals. */
    page_reached: number | null;
    /** Pages covered in this session, recorded at reflection time. */
    pages_read: number | null;
    book: BookSummary | null;
}

export interface BookStat {
    book: BookSummary;
    minutes: number;
    sessions: number;
    /** Pages covered in this book, from recorded page deltas. */
    pages: number;
}

/**
 * Time and pages per book, most time first.
 *
 * Sessions with no book are excluded — see `unattributedMinutes`, which is what
 * the UI must show alongside this so the two add up to the reader's real total.
 */
export function bookBreakdown(sessions: BookSessionLike[]): BookStat[] {
    const byBook = new Map<string, BookStat>();

    for (const session of sessions) {
        if (!session.book_id || !session.book) continue;

        const existing = byBook.get(session.book_id);
        if (existing) {
            existing.minutes += session.duration_minutes ?? 0;
            existing.sessions += 1;
        } else {
            byBook.set(session.book_id, {
                book: session.book,
                minutes: session.duration_minutes ?? 0,
                sessions: 1,
                pages: 0,
            });
        }
    }

    for (const [bookId, stat] of byBook) {
        stat.pages = pagesReadForBook(sessions, bookId);
    }

    return [...byBook.values()].sort((a, b) => b.minutes - a.minutes);
}

/**
 * Minutes read in sessions with no book recorded.
 *
 * Skipping the reading picker is one tap and nothing infers a book from it, so
 * this is real reading time that belongs to no title. The books card has to
 * show it: without it, per-book totals silently read as the whole picture when
 * they can be a fraction of it.
 */
export function unattributedMinutes(sessions: BookSessionLike[]): number {
    return sessions
        .filter((session) => !session.book_id)
        .reduce((sum, session) => sum + (session.duration_minutes ?? 0), 0);
}

/**
 * Pages read across every book.
 *
 * Summed from `pages_read`, which the reflection records against the reader's
 * previous page for that book. It is stored rather than derived because the
 * delta between consecutive sessions cannot describe the first session on a
 * book — that reader would always see zero, however many pages they logged.
 *
 * Only sessions where a page was recorded contribute, so this is a floor on
 * pages read, and the UI says so.
 */
export function pagesRead(sessions: BookSessionLike[]): number {
    return sessions.reduce((sum, session) => sum + (session.pages_read ?? 0), 0);
}

function pagesReadForBook(sessions: BookSessionLike[], bookId: string): number {
    return pagesRead(sessions.filter((session) => session.book_id === bookId));
}

/** Distinct books with at least one recorded session. */
export function booksReadCount(sessions: BookSessionLike[]): number {
    return new Set(
        sessions.map((session) => session.book_id).filter((id): id is string => !!id)
    ).size;
}
