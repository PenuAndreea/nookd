import { queryResult } from '../../../test/supabase-mock';

import { supabase } from '@/lib/supabase';
import { addToReadingList, getActivelyReadBooks, getPopularBooks, getUserBooks } from '@/api/books';

jest.mock('@/lib/supabase', () => ({ supabase: { from: jest.fn() } }));

const from = supabase.from as jest.Mock;

const activeRoom = (overrides: Record<string, unknown> = {}) => ({
    started_at: new Date().toISOString(),
    duration_minutes: 60,
    ...overrides,
});

const expiredRoom = (overrides: Record<string, unknown> = {}) => ({
    started_at: new Date(Date.now() - 90 * 60_000).toISOString(),
    duration_minutes: 60,
    ...overrides,
});

describe('getUserBooks', () => {
    beforeEach(() => from.mockReset());

    it('filters by status only when one is given', async () => {
        const builder = queryResult({ data: [], error: null });
        from.mockReturnValue(builder);

        await getUserBooks('user-1');
        expect(builder.eq).toHaveBeenCalledWith('user_id', 'user-1');
        expect(builder.eq).not.toHaveBeenCalledWith('status', expect.anything());

        builder.eq.mockClear();
        await getUserBooks('user-1', 'finished');
        expect(builder.eq).toHaveBeenCalledWith('status', 'finished');
    });
});

describe('addToReadingList', () => {
    beforeEach(() => from.mockReset());

    it('stamps started_at when marking a book as currently reading', async () => {
        const builder = queryResult({ data: { id: 'entry-1' }, error: null });
        from.mockReturnValue(builder);

        await addToReadingList('user-1', 'book-1', 'currently_reading');

        expect(builder.upsert).toHaveBeenCalledWith(
            expect.objectContaining({ status: 'currently_reading', started_at: expect.any(String) }),
            { onConflict: 'user_id,book_id' }
        );
    });

    it('leaves started_at null for want_to_read (the default)', async () => {
        const builder = queryResult({ data: { id: 'entry-1' }, error: null });
        from.mockReturnValue(builder);

        await addToReadingList('user-1', 'book-1');

        expect(builder.upsert).toHaveBeenCalledWith(
            expect.objectContaining({ status: 'want_to_read', started_at: null }),
            { onConflict: 'user_id,book_id' }
        );
    });
});

describe('getActivelyReadBooks', () => {
    beforeEach(() => from.mockReset());

    it('excludes rooms with no book and rooms whose duration has elapsed', async () => {
        const withBook = { id: 'r1', name: 'A', book: { id: 'book-1' }, ...activeRoom() };
        const noBook = { id: 'r2', name: 'B', book: null, ...activeRoom() };
        const expired = { id: 'r3', name: 'C', book: { id: 'book-2' }, ...expiredRoom() };
        from.mockReturnValue(queryResult({ data: [withBook, noBook, expired], error: null }));

        const result = await getActivelyReadBooks();

        expect(result.map((r) => r.id)).toEqual(['r1']);
    });

    it('caps results at the requested limit', async () => {
        const rooms = Array.from({ length: 10 }, (_, i) => ({
            id: `r${i}`,
            name: `Room ${i}`,
            book: { id: `book-${i}` },
            ...activeRoom(),
        }));
        from.mockReturnValue(queryResult({ data: rooms, error: null }));

        const result = await getActivelyReadBooks(3);

        expect(result).toHaveLength(3);
    });
});

describe('getPopularBooks', () => {
    beforeEach(() => from.mockReset());

    it('counts rooms per book and sorts by popularity, most first', async () => {
        const rows = [
            { book_id: 'dune', book: { id: 'dune', title: 'Dune' } },
            { book_id: 'circle', book: { id: 'circle', title: 'The Circle' } },
            { book_id: 'dune', book: { id: 'dune', title: 'Dune' } },
            { book_id: 'dune', book: { id: 'dune', title: 'Dune' } },
            { book_id: 'no-book', book: null },
        ];
        from.mockReturnValue(queryResult({ data: rows, error: null }));

        const result = await getPopularBooks();

        expect(result).toEqual([
            { book: { id: 'dune', title: 'Dune' }, roomCount: 3 },
            { book: { id: 'circle', title: 'The Circle' }, roomCount: 1 },
        ]);
    });
});
