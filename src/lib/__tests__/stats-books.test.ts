import {
    bookBreakdown,
    booksReadCount,
    pagesRead,
    unattributedMinutes,
    type BookSessionLike,
    type BookSummary,
} from '@/lib/stats-books';

const klara: BookSummary = {
    id: 'book-klara', title: 'Klara and the Sun', author: 'Kazuo Ishiguro',
    cover_url: null, page_count: 300,
};
const potter: BookSummary = {
    id: 'book-potter', title: 'Harry Potter', author: 'J. K. Rowling',
    cover_url: null, page_count: 250,
};

/**
 * `day` is the day-of-month in September 2026, so ordering is obvious.
 * `pagesRead` is what the reflection recorded for this session; `page_reached`
 * is the absolute page, kept for display only.
 */
function session(
    day: number,
    minutes: number,
    book: BookSummary | null,
    pagesRead: number | null = null,
    pageReached: number | null = null
): BookSessionLike {
    return {
        created_at: `2026-09-${String(day).padStart(2, '0')}T10:00:00.123456+00:00`,
        duration_minutes: minutes,
        book_id: book?.id ?? null,
        book,
        pages_read: pagesRead,
        page_reached: pageReached ?? pagesRead,
    };
}

describe('pagesRead', () => {
    it('sums the pages recorded for each session', () => {
        const sessions = [
            session(1, 30, klara, 20),
            session(2, 30, klara, 40),
            session(3, 30, klara, 30),
        ];

        expect(pagesRead(sessions)).toBe(90);
    });

    it('counts the very first session on a book', () => {
        // The bug this replaced: deriving the delta between consecutive
        // sessions meant a reader's first logged pages always showed as 0.
        expect(pagesRead([session(1, 30, klara, 20)])).toBe(20);
    });

    it('ignores sessions where no page was recorded', () => {
        const sessions = [session(1, 30, klara, 20), session(2, 30, klara, null)];

        expect(pagesRead(sessions)).toBe(20);
    });

    it('adds up across different books', () => {
        const sessions = [session(1, 30, klara, 30), session(2, 30, potter, 40)];

        expect(pagesRead(sessions)).toBe(70);
    });

    it('is zero for no sessions', () => {
        expect(pagesRead([])).toBe(0);
    });
});

describe('bookBreakdown', () => {
    it('sums time per book and sorts by time spent', () => {
        const sessions = [
            session(1, 20, klara),
            session(2, 45, potter),
            session(3, 25, klara),
        ];

        const [first, second] = bookBreakdown(sessions);

        expect(first.book.title).toBe('Klara and the Sun');
        expect(first.minutes).toBe(45);
        expect(first.sessions).toBe(2);
        expect(second.book.title).toBe('Harry Potter');
        expect(second.minutes).toBe(45);
    });

    it('aggregates the same book across different rooms', () => {
        // The point of snapshotting book_id: "time on this book" is not
        // "time in one room".
        const stats = bookBreakdown([session(1, 30, klara), session(2, 30, klara)]);

        expect(stats).toHaveLength(1);
        expect(stats[0].minutes).toBe(60);
    });

    it('excludes sessions with no book', () => {
        expect(bookBreakdown([session(1, 30, null)])).toEqual([]);
    });

    it('carries page progress onto each book', () => {
        const stats = bookBreakdown([
            session(1, 30, klara, 20),
            session(2, 30, klara, 35),
        ]);

        expect(stats[0].pages).toBe(55);
    });

    it('keeps each book\'s pages to itself', () => {
        const stats = bookBreakdown([session(1, 30, klara, 20), session(2, 30, potter, 90)]);

        expect(stats.find((stat) => stat.book.id === klara.id)?.pages).toBe(20);
        expect(stats.find((stat) => stat.book.id === potter.id)?.pages).toBe(90);
    });
});

describe('unattributedMinutes', () => {
    it('reports time from sessions with no book', () => {
        const sessions = [session(1, 30, klara), session(2, 45, null), session(3, 25, null)];

        expect(unattributedMinutes(sessions)).toBe(70);
    });

    it('plus per-book time accounts for every minute', () => {
        const sessions = [session(1, 30, klara), session(2, 45, null), session(3, 25, potter)];
        const attributed = bookBreakdown(sessions).reduce((sum, stat) => sum + stat.minutes, 0);

        expect(attributed + unattributedMinutes(sessions)).toBe(100);
    });

    it('is zero when every session has a book', () => {
        expect(unattributedMinutes([session(1, 30, klara)])).toBe(0);
    });
});

describe('booksReadCount', () => {
    it('counts distinct books, not sessions', () => {
        expect(booksReadCount([
            session(1, 30, klara),
            session(2, 30, klara),
            session(3, 30, potter),
            session(4, 30, null),
        ])).toBe(2);
    });

    it('is zero for no sessions', () => {
        expect(booksReadCount([])).toBe(0);
    });
});
