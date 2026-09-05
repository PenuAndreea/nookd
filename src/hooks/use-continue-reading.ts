import { router } from 'expo-router';
import { useCallback } from 'react';

import { Book } from '@/api/books';
import { useRooms } from '@/contexts/rooms-context';

/**
 * "Continue reading" from the library: drop the reader into a silent room for
 * this book. If someone already has one open, join theirs rather than spawning
 * a second one-person room for the same book; otherwise open the create sheet
 * with the book already chosen.
 *
 * No query needed — RoomsProvider already holds every active room (getRooms()
 * filters out the expired ones), so this is a lookup over what's in memory.
 */
export function useContinueReading() {
    const { rooms } = useRooms();

    return useCallback(
        (book: Pick<Book, 'id' | 'title' | 'author' | 'cover_url'>) => {
            const existing = rooms?.find((room) => room.book_id === book.id);

            if (existing) {
                // autojoin is the same path the room list's Join button uses —
                // useRoomSession handles it, including the "leave your current
                // room?" prompt when you're already in a different one.
                router.push({ pathname: '/room/[id]', params: { id: existing.id, autojoin: '1' } });
                return;
            }

            router.push({
                pathname: '/create-room',
                params: {
                    bookId: book.id,
                    bookTitle: book.title,
                    bookAuthor: book.author ?? '',
                    bookCoverUrl: book.cover_url ?? '',
                },
            });
        },
        [rooms]
    );
}
