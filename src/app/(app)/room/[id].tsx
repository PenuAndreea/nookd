import BottomSheet, { BottomSheetBackdrop, BottomSheetBackdropProps, BottomSheetScrollView } from '@gorhom/bottom-sheet';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Alert, Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Animated from 'react-native-reanimated';

import { addToReadingList, getUserBookForBook, getUserBooks, updateReadingListEntry, UserBook, UserBookWithBook } from '@/api/books';
import { Book, forceLeaveRoom, getRoom, getRoomMembersByRoomId, RoomWithBook, updateReadingSession, updateRoomMemberBook } from '@/api/rooms';
import Avatar from '@/components/atoms/avatar';
import Button from '@/components/atoms/button';
import StatusBadge from '@/components/atoms/status-badge';
import { Header } from '@/components/molecules/header';
import ReadingPickerSheet from '@/components/organisms/reading-picker-sheet';
import ReflectionSheet, { ReflectionData } from '@/components/organisms/reflection-sheet';
import TimerCard from '@/components/organisms/timer-card';
import { useAuth } from '@/contexts/auth-context';
import { useRooms } from '@/contexts/rooms-context';
import { useElapsedSeconds } from '@/hooks/use-elapsed-seconds';
import { useRoomPresence } from '@/hooks/use-room-presence';
import { useTheme } from '@/hooks/use-theme';
import { themeForRoom } from '@/lib/room-theme';
import { useLocalSearchParams, useRouter } from 'expo-router';

const READERS_SHOWN = 5;

export default function SilentRoomScreen() {
    const { id, autojoin } = useLocalSearchParams<{ id: string; autojoin?: string }>();
    const { session } = useAuth();
    const colors = useTheme();
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
    // The first point is a peek: the sheet is always on screen so the readers
    // and book are discoverable without knowing to tap the timer.
    // A fixed first point, not a percentage: the peek should be exactly tall
    // enough for the label, which does not scale with screen height.
    const snapPoints = [80, '58%', '88%'];

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

    const renderBackdrop = useCallback(
        (props: BottomSheetBackdropProps) => (
            <BottomSheetBackdrop
                {...props}
                appearsOnIndex={1}
                disappearsOnIndex={0}
                pressBehavior="close"
                opacity={0.35}
            />
        ),
        []
    );

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

    return (
        <View style={{ flex: 1, backgroundColor: theme?.background ?? colors.creme }}>
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

            {/* TODO: bottom sheet can be extracted to own component */}
            <BottomSheet
                ref={bottomSheetRef}
                index={0}
                snapPoints={snapPoints}
                enablePanDownToClose={false}
                backdropComponent={renderBackdrop}
                backgroundStyle={styles.sheetBackground}
                handleIndicatorStyle={styles.handleIndicator}
            >
                <BottomSheetScrollView contentContainerStyle={styles.sheetContent}>
                    <Text style={styles.sheetPeekLabel}>Readers &amp; current book</Text>

                    <View style={styles.sheetTitleRow}>
                        <Text style={styles.sheetTitle} numberOfLines={1}>
                            {room?.name ?? 'Room details'}
                        </Text>
                        <StatusBadge memberCount={memberCount} />
                    </View>
                    {room?.description && (
                        <Text style={styles.sheetDescription}>{room.description}</Text>
                    )}

                    <View style={styles.sectionHeader}>
                        <Text style={styles.sectionTitle}>Readers in the room</Text>
                        <Text style={styles.sectionCount}>{memberCount}</Text>
                    </View>

                    {memberCount === 0 ? (
                        <Text style={styles.emptyHint}>No one is here yet.</Text>
                    ) : (
                        // TODO: this should be a horizontal scroll view, not a row that wraps. The wrapping is a temporary fallback for when there are more than 5 readers. Separate component
                        <View style={styles.readerRow}>
                            {members.slice(0, READERS_SHOWN).map((member) => (
                                <View key={member.user_id} style={styles.readerCell}>
                                    <Avatar id={member.user_id} size="xlarge" />
                                    <Text style={styles.readerName} numberOfLines={1}>
                                        {member.user_id === userId ? 'You' : ''}
                                    </Text>
                                </View>
                            ))}
                            {memberCount > READERS_SHOWN && (
                                <View style={styles.readerCell}>
                                    <View style={styles.moreCircle}>
                                        <Text style={styles.moreText}>+{memberCount - READERS_SHOWN}</Text>
                                    </View>
                                    <Text style={styles.readerName}>More</Text>
                                </View>
                            )}
                        </View>
                    )}

                    <Text style={[styles.sectionTitle, styles.readingTitle]}>Currently reading</Text>

                    {booksInRoom.map(({ book, count }) => (
                        // TODO: use a proper book card component here, with a link to the book page
                        <View key={book.id} style={styles.bookCard}>
                            {book.cover_url ? (
                                <Image source={{ uri: book.cover_url }} style={styles.bookCover} />
                            ) : (
                                <View style={[styles.bookCover, styles.bookCoverEmpty]}>
                                    <Text style={{ fontSize: 20 }}>📖</Text>
                                </View>
                            )}
                            <View style={styles.bookInfo}>
                                <Text style={styles.bookTitle} numberOfLines={2}>{book.title}</Text>
                                {book.author && (
                                    <Text style={styles.bookAuthor} numberOfLines={1}>{book.author}</Text>
                                )}
                                <View style={styles.bookCountPill}>
                                    <Text style={styles.bookCountText}>
                                        {count} reading this book
                                    </Text>
                                </View>
                            </View>
                        </View>
                    ))}

                    {isJoined && !memberBooks[userId ?? ''] && (
                        // TODO: this should be a proper button component, not just a touchable text row
                        <TouchableOpacity style={styles.addBookRow} onPress={openReadingPicker}>
                            <Text style={styles.addBookText}>+ Add what you&apos;re reading</Text>
                        </TouchableOpacity>
                    )}

                    {!isJoined && booksInRoom.length === 0 && (
                        <Text style={styles.emptyHint}>Nothing yet.</Text>
                    )}
                    {isJoined && (
                        <Button
                            title="Leave room"
                            icon="rectangle.portrait.and.arrow.right"
                            onPress={handleLeaveRoom}
                        />
                    )}
                </BottomSheetScrollView>
            </BottomSheet>

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
    sheetBackground: {
        backgroundColor: '#fff',
        borderTopLeftRadius: 26,
        borderTopRightRadius: 26,
        shadowColor: '#263238',
        shadowOpacity: 0.18,
        shadowRadius: 40,
        shadowOffset: {
            width: 0,
            height: -10
        },
        elevation: 12,
    },
    handleIndicator: {
        backgroundColor: '#d8d2c4',
        width: 40,
    },
    // The only thing visible at the peek snap point — a hint of what dragging
    // the sheet up reveals.
    sheetPeekLabel: {
        fontSize: 14,
        color: '#8a8378',
        textAlign: 'center',
        marginBottom: 20,
    },
    sheetContent: {
        paddingHorizontal: 24,
        paddingTop: 16,
        paddingBottom: 40,
    },
    sheetTitleRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 10,
    },
    sheetTitle: {
        flexShrink: 1,
        fontFamily: 'Lora_700Bold',
        fontSize: 22,
        color: '#263238',
    },
    sheetDescription: {
        fontSize: 14,
        color: '#8a8378',
        marginTop: 4,
    },
    sectionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginTop: 22,
        marginBottom: 12,
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: '700',
        color: '#263238',
    },
    sectionCount: {
        fontSize: 16,
        color: '#8a8378',
    },
    readingTitle: {
        marginTop: 22,
        marginBottom: 12,
    },
    readerRow: {
        flexDirection: 'row',
        gap: 14,
    },
    readerCell: {
        alignItems: 'center',
        width: 52,
        gap: 6,
    },
    readerName: {
        fontSize: 12,
        color: '#8a8378',
    },
    moreCircle: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: '#EFEDE9',
        alignItems: 'center',
        justifyContent: 'center',
    },
    moreText: {
        fontSize: 13,
        fontWeight: '700',
        color: '#7B7369',
    },
    bookCard: {
        flexDirection: 'row',
        gap: 14,
        padding: 12,
        marginBottom: 10,
        borderRadius: 14,
        borderWidth: 1,
        borderColor: '#EFEAE1',
        backgroundColor: '#FBF8F3',
    },
    bookCover: {
        width: 56,
        height: 78,
        borderRadius: 8,
        backgroundColor: '#EFEDE9',
    },
    bookCoverEmpty: {
        alignItems: 'center',
        justifyContent: 'center',
    },
    bookInfo: {
        flex: 1,
        gap: 2,
    },
    bookTitle: {
        fontFamily: 'Lora_700Bold',
        fontSize: 16,
        color: '#263238',
    },
    bookAuthor: {
        fontSize: 13,
        color: '#8a8378',
    },
    bookCountPill: {
        alignSelf: 'flex-start',
        marginTop: 6,
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 999,
        backgroundColor: '#EFEDE9',
    },
    bookCountText: {
        fontSize: 12,
        color: '#7B7369',
        fontWeight: '600',
    },
    addBookRow: {
        paddingVertical: 12,
    },
    addBookText: {
        fontSize: 15,
        fontWeight: '600',
        color: '#B0851F',
    },
    emptyHint: {
        fontSize: 14,
        color: '#8a8378',
    },
});
