import type BottomSheet from '@gorhom/bottom-sheet';
import { useEffect, useMemo, useState } from 'react';
import { Alert } from 'react-native';
import type { RefObject } from 'react';

import { UserBookWithBook } from '@/api/books';
import { Book, getRoomMembersByRoomId, updateRoomMemberBook } from '@/api/rooms';
import i18n from '@/i18n';
import type { RoomMember } from '@/hooks/use-room-presence';

interface UseRoomBooksParams {
    roomId: string;
    userId: string | undefined;
    members: RoomMember[];
    libraryBooks: UserBookWithBook[];
    isJoined: boolean;
    /** From useRoomSession — picking a book while not yet joined joins with it directly. */
    attemptJoin: (bookId?: string | null) => Promise<void>;
    readingPickerRef: RefObject<BottomSheet | null>;
}

/**
 * Which book each present member is reading: the per-book badges shown in
 * the room details sheet, and picking (or skipping) your own via the
 * reading-picker sheet. Split out of useRoomSession, which owns the
 * surrounding join/leave lifecycle this builds on.
 */
export function useRoomBooks({
    roomId,
    userId,
    members,
    libraryBooks,
    isJoined,
    attemptJoin,
    readingPickerRef,
}: UseRoomBooksParams) {
    const [memberBooks, setMemberBooks] = useState<Record<string, Book | null>>({});

    // One card per distinct book, with how many people are on it.
    const booksInRoom = useMemo(() => {
        const byBook = new Map<string, { book: Book; count: number }>()
        for (const member of members) {
            const book = memberBooks[member.user_id]
            if (!book) continue
            const seen = byBook.get(book.id)
            if (seen) seen.count += 1
            else byBook.set(book.id, { book, count: 1 })
        }
        return [...byBook.values()].sort((a, b) => b.count - a.count)
    }, [members, memberBooks]);
    // The book *this* reader picked. `selfHasBook` used to be all the caller
    // needed, but the reflection sheet has to gate its page field on the book
    // actually being read, which in a house room is this one rather than the
    // room's.
    const selfBook = userId ? memberBooks[userId] ?? null : null;
    const selfHasBook = !!selfBook;

    useEffect(() => {
        if (!members.length) return

        let isActive = true

        getRoomMembersByRoomId(roomId)
            .then((roomMembers) => {
                if (isActive) {
                    setMemberBooks(Object.fromEntries(roomMembers.map((m) => [m.user_id, m.book])))
                }
            })
            // Decorative — degrades to no book badges next to readers, not
            // worth interrupting the room over.
            .catch((error) => console.error('Error loading member books:', error))

        return () => {
            isActive = false
        }
    }, [members, roomId])

    async function handleSelectBook(bookId: string) {
        readingPickerRef.current?.close()

        if (!isJoined) {
            await attemptJoin(bookId)
            return
        }

        if (!userId) return

        try {
            await updateRoomMemberBook(roomId, userId, bookId)
            const selected = libraryBooks.find((entry) => entry.book_id === bookId)?.book ?? null
            setMemberBooks((prev) => ({ ...prev, [userId]: selected }))
        } catch (error) {
            console.error('Error updating book selection:', error)
            Alert.alert(i18n.t('rooms.selectBookErrorTitle'), i18n.t('rooms.selectBookErrorMessage'))
        }
    }

    async function handleSkipBook() {
        readingPickerRef.current?.close()
        if (!isJoined) {
            await attemptJoin()
        }
    }

    function openReadingPicker() {
        readingPickerRef.current?.snapToIndex(0)
    }

    return { booksInRoom, selfBook, selfHasBook, handleSelectBook, handleSkipBook, openReadingPicker };
}
