import { parsePgTimestamp } from '@/lib/date';
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
    page_reached: number | null;
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
 * `page_reached` is an ABSOLUTE page number, not a per-session count, so the
 * pages read in a session are the *increase* over the previous session on the
 * same book. Summing `page_reached` directly is the obvious wrong version: it
 * produces a large, plausible-looking number that means nothing.
 *
 * Only sessions where a page was actually recorded contribute, so this is a
 * floor on pages read, and the UI should say so.
 */
export function pagesRead(sessions: BookSessionLike[]): number {
    const bookIds = new Set(
        sessions.map((session) => session.book_id).filter((id): id is string => !!id)
    );

    let total = 0;
    for (const bookId of bookIds) {
        total += pagesReadForBook(sessions, bookId);
    }

    return total;
}

function pagesReadForBook(sessions: BookSessionLike[], bookId: string): number {
    const withPages = sessions
        .filter((session) => session.book_id === bookId && session.page_reached != null)
        .map((session) => ({
            at: parsePgTimestamp(session.created_at) ?? 0,
            page: session.page_reached as number,
        }))
        .sort((a, b) => a.at - b.at);

    if (withPages.length === 0) return 0;

    // The first recorded page is where the reader had already got to, not
    // progress made in that session — counting it would credit the whole book
    // up to that point to one sitting.
    let total = 0;
    for (let i = 1; i < withPages.length; i += 1) {
        // A drop means a re-read or a typo; it is not negative progress.
        total += Math.max(withPages[i].page - withPages[i - 1].page, 0);
    }

    return total;
}

/** Distinct books with at least one recorded session. */
export function booksReadCount(sessions: BookSessionLike[]): number {
    return new Set(
        sessions.map((session) => session.book_id).filter((id): id is string => !!id)
    ).size;
}
