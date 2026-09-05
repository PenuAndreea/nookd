import type BottomSheet from '@gorhom/bottom-sheet';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Alert } from 'react-native';
import type { RefObject } from 'react';

import { UserBookWithBook } from '@/api/books';
import { forceLeaveRoom, getRoomMembersByRoomId, RoomWithBook } from '@/api/rooms';
import i18n from '@/i18n';
import { useRooms } from '@/contexts/rooms-context';
import { useElapsedSeconds } from '@/hooks/use-elapsed-seconds';
import { useRoomBooks } from '@/hooks/use-room-books';
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
 * one) and leaving. Room *data* itself lives in useRoomData, and which book
 * each member is reading lives in useRoomBooks — this hook is the join/leave
 * lifecycle both sit on top of, plus the presence connection itself.
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
    const { members, memberCount, lastSessionId, isJoined, presenceError, joinRoom, leaveRoom } =
        useRoomPresence(roomId, userId)
    const { currentRoom, markJoined, markLeft } = useRooms()

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
            Alert.alert(i18n.t('rooms.joinErrorTitle'), i18n.t('rooms.joinErrorMessage'))
        }
    }, [joinRoom, markJoined, roomId, userId])

    const { booksInRoom, selfBook, selfHasBook, handleSelectBook, handleSkipBook, openReadingPicker } = useRoomBooks({
        roomId,
        userId,
        members,
        libraryBooks,
        isJoined,
        attemptJoin,
        readingPickerRef,
    });

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
            // Background reconciliation, not a user-initiated action — on
            // failure we just fall through to the normal "not joined" state
            // (the Join button), which is a reasonable degrade on its own.
            .catch((error) => console.error('Error checking existing membership:', error))
            .finally(() => setHasCheckedMembership(true))
    }, [userId, room, roomId, attemptJoin])

    function proceedToJoin() {
        if (room?.vibe === 'book_club') {
            attemptJoin()
        } else {
            openReadingPicker()
        }
    }

    async function switchFromCurrentRoom(oldRoomId: string) {
        if (!userId) return
        try {
            await forceLeaveRoom(oldRoomId, userId)
            markLeft(oldRoomId, userId)
        } catch (error) {
            console.error('Error leaving previous room:', error)
            Alert.alert(i18n.t('rooms.switchRoomErrorTitle'), i18n.t('rooms.switchRoomErrorMessage'))
            return
        }
        proceedToJoin()
    }

    function handleJoinPress() {
        if (hasAttemptedJoinRef.current) return

        if (currentRoom && currentRoom.id !== roomId) {
            Alert.alert(
                i18n.t('rooms.leaveCurrentRoomTitle'),
                i18n.t('rooms.leaveCurrentRoomMessage', {
                    roomName: currentRoom.name ?? i18n.t('rooms.leaveCurrentRoomFallbackName'),
                }),
                [
                    { text: i18n.t('common.cancel'), style: 'cancel' },
                    {
                        text: i18n.t('rooms.leaveAndJoin'),
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

    // A timed room ends on schedule whether or not anyone is watching. For the
    // reader who *is*, close the session the moment the clock runs out instead
    // of leaving them sitting in a finished room until the reaper notices a
    // minute later. Both paths produce the same row: the server derives
    // ended_reason = 'completed' from the room's own scheduled end rather than
    // trusting whatever the client calls it.
    const hasExpiredRef = useRef(false)
    useEffect(() => {
        if (hasExpiredRef.current || !isJoined) return
        if (room?.duration_minutes == null) return
        if (displayedElapsedSeconds < room.duration_minutes * 60) return

        hasExpiredRef.current = true
        handleLeaveRoom()
        // handleLeaveRoom is re-created every render; the ref above is what
        // keeps this to a single run.
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isJoined, room, displayedElapsedSeconds])

    async function handleLeaveRoom() {
        bottomSheetRef.current?.close();
        try {
            await leaveRoom();
        } catch (error) {
            console.error('Error leaving room:', error)
            Alert.alert(i18n.t('rooms.switchRoomErrorTitle'), i18n.t('rooms.switchRoomErrorMessage'))
            return
        }
        if (userId) markLeft(roomId, userId)
        setJoinedAt(null)
        reflectionSheetRef.current?.snapToIndex(0);
    }

    return {
        members,
        memberCount,
        lastSessionId,
        isJoined,
        presenceError,
        hasCheckedMembership,
        displayedElapsedSeconds,
        booksInRoom,
        selfBook,
        selfHasBook,
        handleJoinPress,
        handleLeaveRoom,
        handleSelectBook,
        handleSkipBook,
        openReadingPicker,
    };
}
