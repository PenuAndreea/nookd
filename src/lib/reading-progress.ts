import { UserBookWithBook } from '@/api/books';

export interface ReadingProgress {
    /** 0–1, clamped — for a progress bar's width. */
    ratio: number;
    /** 0–100, rounded — for the "48% · …" label. */
    percent: number;
    pagesLeft: number;
}

/**
 * How far through a book the reader is, or null when there is nothing
 * meaningful to show — an unknown page count, or no recorded page. Callers
 * render the bar and the label only when this returns a value, rather than
 * printing "0% · null pages left".
 */
export function readingProgress(userBook: UserBookWithBook): ReadingProgress | null {
    const pageCount = userBook.book.page_count;
    const currentPage = userBook.current_page;

    if (!pageCount || pageCount <= 0 || currentPage == null) return null;

    const ratio = Math.min(Math.max(currentPage / pageCount, 0), 1);

    return {
        ratio,
        percent: Math.round(ratio * 100),
        pagesLeft: Math.max(pageCount - currentPage, 0),
    };
}
