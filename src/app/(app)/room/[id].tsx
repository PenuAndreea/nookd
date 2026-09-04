import BottomSheet from '@gorhom/bottom-sheet';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Alert, Image, StyleSheet, View } from 'react-native';
import Animated from 'react-native-reanimated';

import { addToReadingList, getUserBookForBook, getUserBooks, updateReadingListEntry, UserBook, UserBookWithBook } from '@/api/books';
import { Book, forceLeaveRoom, getRoom, getRoomMembersByRoomId, RoomWithBook, updateReadingSession, updateRoomMemberBook } from '@/api/rooms';
import Button from '@/components/atoms/button';
import { Header } from '@/components/molecules/header';
import ReadingPickerSheet from '@/components/organisms/reading-picker-sheet';
import ReflectionSheet, { ReflectionData } from '@/components/organisms/reflection-sheet';
import RoomDetailsSheet from '@/components/organisms/room-details-sheet';
import TimerCard from '@/components/organisms/timer-card';
import { useAuth } from '@/contexts/auth-context';
import { useRooms } from '@/contexts/rooms-context';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useElapsedSeconds } from '@/hooks/use-elapsed-seconds';
import { useRoomPresence } from '@/hooks/use-room-presence';
import { useTheme } from '@/hooks/use-theme';
import { themeForRoom } from '@/lib/room-theme';
import { useLocalSearchParams, useRouter } from 'expo-router';

export default function SilentRoomScreen() {
    const { id, autojoin } = useLocalSearchParams<{ id: string; autojoin?: string }>();
    const { session } = useAuth();
    const colors = useTheme();
    const isDark = useColorScheme() === 'dark';
    const router = useRouter();
    const userId = session?.user?.id;

    const roomId = Array.isArray(id) ? id[0] : id;

    const { members, memberCount, lastSessionId, isJoined, joinRoom, leaveRoom } =
        useRoomPresence(roomId, userId)
    const { currentRoom, markJoined, markLeft } = useRooms()

    const [room, setRoom] = useState<RoomWithBook | undefined>();
    const [userBookForRoom, setUserBookForRoom] = useState<UserBook | null>(null);
    const [memberBooks, setMemberBooks] = useState<Record<string, Book | null>>({});
    const [libraryBooks, setLibraryBooks] = useState<UserBookWithBook[]>([]);
    // When *this* user joined, read from the membership row so it survives
    // leaving the screen and coming back.
    const [joinedAt, setJoinedAt] = useState<string | null>(null);

    const theme = room ? themeForRoom(room) : null;

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
    // A timed room counts down from when the room started, so everyone in it
    // sees the same clock. A house room never ends, so the only meaningful
    // number is how long *you* have been reading.
    const isOpenEnded = room != null && room.duration_minutes == null;
    const roomElapsedSeconds = useElapsedSeconds(room?.started_at);
    const sessionElapsedSeconds = useElapsedSeconds(joinedAt);
    const displayedElapsedSeconds = isOpenEnded ? sessionElapsedSeconds : roomElapsedSeconds;

    const bottomSheetRef = useRef<BottomSheet>(null);
    const reflectionSheetRef = useRef<BottomSheet>(null);
    const readingPickerRef = useRef<BottomSheet>(null);

    useEffect(() => {
        async function loadRoom() {
            try {
                const data = await getRoom(id.toString())
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
    }, [id, userId])

    useEffect(() => {
        if (!userId) return

        getUserBooks(userId)
            .then(setLibraryBooks)
            .catch((error) => console.error('Error loading library:', error))
    }, [userId])

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

    const openDetails = () => {
        bottomSheetRef.current?.snapToIndex(1);
    };

    async function handleLeaveRoom() {
        bottomSheetRef.current?.close();
        await leaveRoom();
        if (userId) markLeft(roomId, userId)
        setJoinedAt(null)
        reflectionSheetRef.current?.snapToIndex(0);
    }

    async function handleReflectionSubmit(data: ReflectionData) {
        if (lastSessionId) {
            await updateReadingSession(lastSessionId, {
                thoughts: data.thoughts || null,
                page_reached: data.pageReached,
                mood: data.mood,
                ended_at: new Date().toISOString(),
                completed: true,
            });
        }

        if (room?.book_id && userId) {
            const patch: Partial<Pick<UserBook, 'status' | 'current_page' | 'started_at' | 'finished_at'>> = {};
            if (data.pageReached != null) patch.current_page = data.pageReached;
            if (data.finished) {
                patch.status = 'finished';
                patch.finished_at = new Date().toISOString();
            }

            if (userBookForRoom) {
                await updateReadingListEntry(userBookForRoom.id, patch);
            } else {
                await addToReadingList(
                    userId,
                    room.book_id,
                    data.finished ? 'finished' : 'currently_reading'
                );
            }
        }

        reflectionSheetRef.current?.close();
        router.back();
    }

    function handleReflectionSkip() {
        reflectionSheetRef.current?.close();
        router.back();
    }

    // The theme illustrations are light-mode artwork with no dark variant, so
    // matching the screen to their sampled background only makes sense in
    // light mode — in dark mode the page falls back to the app's own dark
    // creme rather than pairing a bright pastel illustration with a bright
    // pastel background regardless of the user's chosen theme.
    const screenBackground = theme && !isDark ? theme.background : colors.creme;

    return (
        <View style={{ flex: 1, backgroundColor: screenBackground }}>
            <Header
                title=''
                showBack
                right={hasCheckedMembership && !isJoined ? (
                    <Button title="Join" size="small" onPress={handleJoinPress} />
                ) : undefined}
            />
            <View style={{ flex: 1 }}>
                {theme && (
                    <Animated.View style={styles.illustration}>
                        <Image
                            source={theme.source}
                            style={styles.illustrationImage}
                            resizeMode="cover"
                        />
                    </Animated.View>
                )}
                <TimerCard
                    elapsedSeconds={displayedElapsedSeconds}
                    duration={room?.duration_minutes ?? null}
                    memberCount={memberCount}
                    onPress={openDetails}
                />
            </View>

            <RoomDetailsSheet
                ref={bottomSheetRef}
                room={room}
                memberCount={memberCount}
                members={members}
                userId={userId}
                booksInRoom={booksInRoom}
                isJoined={isJoined}
                selfHasBook={selfHasBook}
                onAddBook={openReadingPicker}
                onLeaveRoom={handleLeaveRoom}
            />

            <ReflectionSheet
                ref={reflectionSheetRef}
                book={room?.book ?? null}
                initialPage={userBookForRoom?.current_page}
                onSubmit={handleReflectionSubmit}
                onSkip={handleReflectionSkip}
            />

            <ReadingPickerSheet
                ref={readingPickerRef}
                books={libraryBooks}
                onSelect={handleSelectBook}
                onSkip={handleSkipBook}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    illustration: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        // Taller than the square source, so "cover" trims a little from each
        // side and the art fills more of the screen. The matching background
        // colour carries it the rest of the way down.
        height: '55%',
        overflow: 'hidden',
    },
    illustrationImage: {
        width: '100%',
        height: '100%',
        // Every theme file carries a 1–2px dark border. Scaling up slightly
        // pushes it outside the clipped container so it never shows as a line.
        transform: [{ scale: 1.04 }],
    },
});
