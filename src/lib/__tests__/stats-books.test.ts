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

/** `day` is the day-of-month in September 2026, so ordering is obvious. */
function session(
    day: number,
    minutes: number,
    book: BookSummary | null,
    pageReached: number | null = null
): BookSessionLike {
    return {
        created_at: `2026-09-${String(day).padStart(2, '0')}T10:00:00.123456+00:00`,
        duration_minutes: minutes,
        book_id: book?.id ?? null,
        book,
        page_reached: pageReached,
    };
}

describe('pagesRead', () => {
    it('counts the increase between sessions, not the sum of page numbers', () => {
        // Reached page 20, then 60, then 90 — that is 70 pages of progress.
        // Summing page_reached would say 170, which is the wrong answer that
        // looks plausible enough to ship.
        const sessions = [
            session(1, 30, klara, 20),
            session(2, 30, klara, 60),
            session(3, 30, klara, 90),
        ];

        expect(pagesRead(sessions)).toBe(70);
    });

    it('does not credit the first recorded page as progress', () => {
        // A reader who joins already 200 pages in has not read 200 pages today.
        expect(pagesRead([session(1, 30, klara, 200)])).toBe(0);
    });

    it('treats a drop as zero rather than negative progress', () => {
        // Re-reading, or a typo. Either way it is not -60 pages.
        const sessions = [
            session(1, 30, klara, 90),
            session(2, 30, klara, 30),
            session(3, 30, klara, 50),
        ];

        expect(pagesRead(sessions)).toBe(20);
    });

    it('keeps two books from contaminating each other', () => {
        const sessions = [
            session(1, 30, klara, 10),
            session(2, 30, potter, 500),
            session(3, 30, klara, 40),
            session(4, 30, potter, 540),
        ];

        // 30 for Klara, 40 for Potter — never 530 from crossing the two.
        expect(pagesRead(sessions)).toBe(70);
    });

    it('orders by session time, not array order', () => {
        const sessions = [
            session(3, 30, klara, 90),
            session(1, 30, klara, 20),
            session(2, 30, klara, 60),
        ];

        expect(pagesRead(sessions)).toBe(70);
    });

    it('ignores sessions where no page was recorded', () => {
        const sessions = [
            session(1, 30, klara, 20),
            session(2, 30, klara, null),
            session(3, 30, klara, 60),
        ];

        expect(pagesRead(sessions)).toBe(40);
    });

    it('is zero for no sessions and for sessions with no book', () => {
        expect(pagesRead([])).toBe(0);
        expect(pagesRead([session(1, 30, null, 40)])).toBe(0);
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
            session(2, 30, klara, 75),
        ]);

        expect(stats[0].pages).toBe(55);
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
