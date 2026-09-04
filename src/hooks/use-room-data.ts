import { useEffect, useState } from 'react';

import { getUserBookForBook, getUserBooks, UserBook, UserBookWithBook } from '@/api/books';
import { getRoom, RoomWithBook } from '@/api/rooms';
import { RoomTheme, themeForRoom } from '@/lib/room-theme';

export interface RoomDataState {
    room: RoomWithBook | undefined;
    userBookForRoom: UserBook | null;
    libraryBooks: UserBookWithBook[];
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
    const [userBookForRoom, setUserBookForRoom] = useState<UserBook | null>(null);
    const [libraryBooks, setLibraryBooks] = useState<UserBookWithBook[]>([]);

    useEffect(() => {
        async function loadRoom() {
            try {
                const data = await getRoom(roomId)
                setRoom(data ?? undefined)

                if (data?.book_id && userId) {
                    const entry = await getUserBookForBook(userId, data.book_id)
                    setUserBookForRoom(entry)
                }
            } catch (error) {
                console.log('Error fetching room:', error)
            }
        }
        loadRoom()
    }, [roomId, userId])

    useEffect(() => {
        if (!userId) return

        getUserBooks(userId)
            .then(setLibraryBooks)
            .catch((error) => console.error('Error loading library:', error))
    }, [userId])

    const theme = room ? themeForRoom(room) : null;

    return { room, userBookForRoom, libraryBooks, theme };
}
