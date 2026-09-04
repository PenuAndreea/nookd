import { useCallback, useEffect, useState } from 'react';

import { getUserBookForBook, getUserBooks, UserBook, UserBookWithBook } from '@/api/books';
import { getRoom, RoomWithBook } from '@/api/rooms';
import { RoomTheme, themeForRoom } from '@/lib/room-theme';

export interface RoomDataState {
    room: RoomWithBook | undefined;
    /** Set when the room itself failed to load — `room` stays undefined either way while loading, so callers need this to tell "still loading" from "gave up". */
    roomError: boolean;
    retryRoom: () => void;
    userBookForRoom: UserBook | null;
    libraryBooks: UserBookWithBook[];
    /** Set when the user's library failed to load — the reading picker uses this to show an error instead of claiming the library is empty. */
    libraryError: boolean;
    retryLibrary: () => void;
    theme: RoomTheme | null;
}

/**
 * Passive data for a room screen: the room itself, the user's own library
 * (source for the reading-picker sheet), and their existing library entry
 * for this room's book, if any. Kept separate from useRoomSession, which
 * owns the interactive join/leave/pick-a-book lifecycle built on top of it.
 */
export function useRoomData(roomId: string, userId: string | undefined): RoomDataState {
    const [room, setRoom] = useState<RoomWithBook | undefined>();
    const [roomError, setRoomError] = useState(false);
    const [userBookForRoom, setUserBookForRoom] = useState<UserBook | null>(null);
    const [libraryBooks, setLibraryBooks] = useState<UserBookWithBook[]>([]);
    const [libraryError, setLibraryError] = useState(false);
    const [roomReloadToken, setRoomReloadToken] = useState(0);
    const [libraryReloadToken, setLibraryReloadToken] = useState(0);

    useEffect(() => {
        let isActive = true

        async function loadRoom() {
            try {
                const data = await getRoom(roomId)
                if (!isActive) return
                setRoom(data ?? undefined)
                setRoomError(false)

                if (data?.book_id && userId) {
                    const entry = await getUserBookForBook(userId, data.book_id)
                    if (isActive) setUserBookForRoom(entry)
                }
            } catch (error) {
                console.error('Error fetching room:', error)
                if (isActive) setRoomError(true)
            }
        }
        loadRoom()

        return () => {
            isActive = false
        }
    }, [roomId, userId, roomReloadToken])

    const retryRoom = useCallback(() => setRoomReloadToken((n) => n + 1), [])

    useEffect(() => {
        if (!userId) return

        getUserBooks(userId)
            .then((books) => {
                setLibraryBooks(books)
                setLibraryError(false)
            })
            .catch((error) => {
                console.error('Error loading library:', error)
                setLibraryError(true)
            })
    }, [userId, libraryReloadToken])

    const retryLibrary = useCallback(() => setLibraryReloadToken((n) => n + 1), [])

    const theme = room ? themeForRoom(room) : null;

    return { room, roomError, retryRoom, userBookForRoom, libraryBooks, libraryError, retryLibrary, theme };
}
