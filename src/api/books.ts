import { isRoomActive } from '@/api/nookd';
import { supabase } from '@/lib/supabase';

import type { Tables } from '../../database.types';

export type Book = Tables<'books'>;
export type UserBook = Tables<'user_books'>;
export type UserBookStatus = UserBook['status'];
export type UserBookWithBook = UserBook & { book: Book };

export interface OpenLibraryResult {
    openLibraryKey: string;
    title: string;
    author: string;
    coverUrl?: string;
    pageCount?: number;
}

export interface RoomWithBook {
    id: string;
    name: string | null;
    book: Book;
}

export interface PopularBook {
    book: Book;
    roomCount: number;
}

export async function searchOpenLibrary(query: string): Promise<OpenLibraryResult[]> {
    const res = await fetch(
        `https://openlibrary.org/search.json?q=${encodeURIComponent(query)}&limit=5&fields=key,title,author_name,cover_i,number_of_pages_median`
    );
    const data = await res.json();

    return (data.docs ?? []).map((item: any) => ({
        openLibraryKey: item.key,
        title: item.title,
        author: item.author_name?.[0] ?? 'Unknown author',
        coverUrl: item.cover_i
            ? `https://covers.openlibrary.org/b/id/${item.cover_i}-L.jpg`
            : undefined,
        pageCount: item.number_of_pages_median ?? undefined,
    }));
}

export async function getOrCreateBook(result: OpenLibraryResult): Promise<Book> {
    const { data, error } = await supabase
        .from('books')
        .upsert(
            {
                open_library_key: result.openLibraryKey,
                title: result.title,
                author: result.author,
                cover_url: result.coverUrl,
                page_count: result.pageCount ?? null,
            },
            { onConflict: 'open_library_key' }
        )
        .select()
        .single();

    if (error) {
        throw error;
    }

    return data;
}

export async function getBook(id: Book['id']): Promise<Book | null> {
    const { data, error } = await supabase
        .from('books')
        .select()
        .eq('id', id)
        .maybeSingle();

    if (error) {
        throw error;
    }

    return data;
}

export async function getUserBooks(
    userId: string,
    status?: UserBookStatus
): Promise<UserBookWithBook[]> {
    let query = supabase
        .from('user_books')
        .select('*, book:books(*)')
        .eq('user_id', userId)
        .order('updated_at', { ascending: false });

    if (status) {
        query = query.eq('status', status);
    }

    const { data, error } = await query;

    if (error) {
        throw error;
    }

    return (data ?? []) as unknown as UserBookWithBook[];
}

export async function getUserBookForBook(
    userId: string,
    bookId: Book['id']
): Promise<UserBook | null> {
    const { data, error } = await supabase
        .from('user_books')
        .select()
        .eq('user_id', userId)
        .eq('book_id', bookId)
        .maybeSingle();

    if (error) {
        throw error;
    }

    return data;
}

export async function addToReadingList(
    userId: string,
    bookId: Book['id'],
    status: UserBookStatus = 'want_to_read'
): Promise<UserBook> {
    const { data, error } = await supabase
        .from('user_books')
        .upsert(
            {
                user_id: userId,
                book_id: bookId,
                status,
                started_at: status === 'currently_reading' ? new Date().toISOString() : null,
            },
            { onConflict: 'user_id,book_id' }
        )
        .select()
        .single();

    if (error) {
        throw error;
    }

    return data;
}

export async function updateReadingListEntry(
    id: UserBook['id'],
    patch: Partial<Pick<UserBook, 'status' | 'current_page' | 'started_at' | 'finished_at'>>
): Promise<UserBook> {
    const { data, error } = await supabase
        .from('user_books')
        .update(patch)
        .eq('id', id)
        .select()
        .single();

    if (error) {
        throw error;
    }

    return data;
}

export async function removeFromReadingList(id: UserBook['id']): Promise<void> {
    const { error } = await supabase.from('user_books').delete().eq('id', id);

    if (error) {
        throw error;
    }
}

export async function countActiveRoomsForBook(bookId: Book['id']): Promise<number> {
    const { data, error } = await supabase
        .from('rooms')
        .select('started_at, duration_minutes')
        .eq('book_id', bookId);

    if (error) {
        throw error;
    }

    return (data ?? []).filter(isRoomActive).length;
}

export async function getActivelyReadBooks(limit = 6): Promise<RoomWithBook[]> {
    const { data, error } = await supabase
        .from('rooms')
        .select('id, name, started_at, duration_minutes, book:books(*)')
        .not('book_id', 'is', null)
        .order('started_at', { ascending: false })
        .limit(limit * 4);

    if (error) {
        throw error;
    }

    return ((data ?? []) as unknown as (RoomWithBook & { started_at: string; duration_minutes: number | null })[])
        .filter((row) => row.book && isRoomActive(row))
        .slice(0, limit);
}

export async function getPopularBooks(limit = 6): Promise<PopularBook[]> {
    const { data, error } = await supabase
        .from('rooms')
        .select('book_id, book:books(*)')
        .not('book_id', 'is', null);

    if (error) {
        throw error;
    }

    const counts = new Map<string, PopularBook>();
    for (const row of (data ?? []) as unknown as { book_id: string; book: Book | null }[]) {
        if (!row.book) continue;
        const existing = counts.get(row.book_id);
        if (existing) {
            existing.roomCount += 1;
        } else {
            counts.set(row.book_id, { book: row.book, roomCount: 1 });
        }
    }

    return Array.from(counts.values())
        .sort((a, b) => b.roomCount - a.roomCount)
        .slice(0, limit);
}
