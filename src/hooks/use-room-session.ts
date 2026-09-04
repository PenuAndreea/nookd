import type BottomSheet from '@gorhom/bottom-sheet';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Alert } from 'react-native';
import type { RefObject } from 'react';

import { UserBookWithBook } from '@/api/books';
import { Book, forceLeaveRoom, getRoomMembersByRoomId, RoomWithBook, updateRoomMemberBook } from '@/api/rooms';
import { useRooms } from '@/contexts/rooms-context';
import { useElapsedSeconds } from '@/hooks/use-elapsed-seconds';
import { useRoomPresence } from '@/hooks/use-room-presence';

interface UseRoomSessionParams {
    roomId: string;
    userId: string | undefined;
    room: RoomWithBook | undefined;
    libraryBooks: UserBookWithBook[];
    /** From the URL — arriving via a room card's "Join" button. */
    autojoin: string | undefined;
    bottomSheetRef: RefObject<BottomSheet | null>;
    reflectionSheetRef: RefObject<BottomSheet | null>;
    readingPickerRef: RefObject<BottomSheet | null>;
}

/**
 * The interactive lifecycle of being in a room: joining (including the
 * "leave your current room?" prompt when you're already in a different
 * one), leaving, and picking which book you're reading here. Room *data*
 * itself (the room row, your library) lives in useRoomData — this hook is
 * everything built on top of it, plus the presence connection itself.
 */
export function useRoomSession({
    roomId,
    userId,
    room,
    libraryBooks,
    autojoin,
    bottomSheetRef,
    reflectionSheetRef,
    readingPickerRef,
}: UseRoomSessionParams) {
    const { members, memberCount, lastSessionId, isJoined, joinRoom, leaveRoom } =
        useRoomPresence(roomId, userId)
    const { currentRoom, markJoined, markLeft } = useRooms()

    const [memberBooks, setMemberBooks] = useState<Record<string, Book | null>>({});
    // When *this* user joined, read from the membership row so it survives
    // leaving the screen and coming back.
    const [joinedAt, setJoinedAt] = useState<string | null>(null);

    // A timed room counts down from when the room started, so everyone in it
    // sees the same clock. A house room never ends, so the only meaningful
    // number is how long *you* have been reading.
    const isOpenEnded = room != null && room.duration_minutes == null;
    const roomElapsedSeconds = useElapsedSeconds(room?.started_at);
    const sessionElapsedSeconds = useElapsedSeconds(joinedAt);
    const displayedElapsedSeconds = isOpenEnded ? sessionElapsedSeconds : roomElapsedSeconds;

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
    const selfHasBook = !!(userId && memberBooks[userId]);

    const hasAttemptedJoinRef = useRef(false)
    const hasCheckedMembershipRef = useRef(false)
    const [hasCheckedMembership, setHasCheckedMembership] = useState(false)

    const attemptJoin = useCallback(async (bookId?: string | null) => {
        hasAttemptedJoinRef.current = true
        try {
            await joinRoom(bookId)
            // Keep a joined_at already read from the database; only a genuinely
            // fresh join starts the clock now.
            setJoinedAt((current) => current ?? new Date().toISOString())
            if (userId) markJoined(roomId, userId)
        } catch (error) {
            console.error('Error joining room:', error)
            hasAttemptedJoinRef.current = false
        }
    }, [joinRoom, markJoined, roomId, userId])

    // Silently re-establish presence if the user already joined this room
    // on a previous visit — otherwise leave it to the "Join" button so
    // arriving at a room doesn't auto-join you. Guarded by a ref rather than
    // the state flag so the check runs exactly once per mount, no matter how
    // often the effect's dependencies change identity.
    useEffect(() => {
        if (!userId || !room || hasCheckedMembershipRef.current) return
        hasCheckedMembershipRef.current = true

        getRoomMembersByRoomId(roomId)
            .then((roomMembers) => {
                const existingMember = roomMembers.find((m) => m.user_id === userId)
                if (!existingMember) return
                setJoinedAt(existingMember.joined_at)
                return attemptJoin(existingMember.book_id)
            })
            .catch((error) => console.error('Error checking existing membership:', error))
            .finally(() => setHasCheckedMembership(true))
    }, [userId, room, roomId, attemptJoin])

    function proceedToJoin() {
        if (room?.vibe === 'book_club') {
            attemptJoin()
        } else {
            readingPickerRef.current?.snapToIndex(0)
        }
    }

    async function switchFromCurrentRoom(oldRoomId: string) {
        if (!userId) return
        try {
            await forceLeaveRoom(oldRoomId, userId)
            markLeft(oldRoomId, userId)
        } catch (error) {
            console.error('Error leaving previous room:', error)
            return
        }
        proceedToJoin()
    }

    function handleJoinPress() {
        if (hasAttemptedJoinRef.current) return

        if (currentRoom && currentRoom.id !== roomId) {
            Alert.alert(
                'Leave current room?',
                `You're already in "${currentRoom.name ?? 'a silent room'}". Leave it and join this room instead?`,
                [
                    { text: 'Cancel', style: 'cancel' },
                    {
                        text: 'Leave & Join',
                        style: 'destructive',
                        onPress: () => switchFromCurrentRoom(currentRoom.id),
                    },
                ]
            )
            return
        }

        proceedToJoin()
    }

    // Arriving from a room card's "Join" button. Wait for the membership check
    // so we don't prompt someone who is already in this room, then run the same
    // path the in-screen Join button uses.
    const autoJoinRef = useRef(false)
    useEffect(() => {
        if (autojoin !== '1' || !hasCheckedMembership || isJoined || autoJoinRef.current) return
        autoJoinRef.current = true
        handleJoinPress()
        // handleJoinPress is re-created every render; the ref above is what
        // keeps this to a single run.
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [autojoin, hasCheckedMembership, isJoined])

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

    useEffect(() => {
        if (!members.length) return

        let isActive = true

        getRoomMembersByRoomId(roomId)
            .then((roomMembers) => {
                if (isActive) {
                    setMemberBooks(Object.fromEntries(roomMembers.map((m) => [m.user_id, m.book])))
                }
            })
            .catch((error) => console.error('Error loading member books:', error))

        return () => {
            isActive = false
        }
    }, [members, roomId])

    async function handleLeaveRoom() {
        bottomSheetRef.current?.close();
        await leaveRoom();
        if (userId) markLeft(roomId, userId)
        setJoinedAt(null)
        reflectionSheetRef.current?.snapToIndex(0);
    }

    return {
        members,
        memberCount,
        lastSessionId,
        isJoined,
        hasCheckedMembership,
        displayedElapsedSeconds,
        booksInRoom,
        selfHasBook,
        handleJoinPress,
        handleLeaveRoom,
        handleSelectBook,
        handleSkipBook,
        openReadingPicker,
    };
}
