import BottomSheet, { BottomSheetBackdrop, BottomSheetBackdropProps, BottomSheetView } from '@gorhom/bottom-sheet';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Alert, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Animated from 'react-native-reanimated';

import { addToReadingList, getUserBookForBook, getUserBooks, UserBook, updateReadingListEntry, UserBookWithBook } from '@/api/books';
import { Book, forceLeaveRoom, getRoom, getRoomMembersByRoomId, RoomWithBook, updateReadingSession, updateRoomMemberBook } from '@/api/nookd';
import ReadingBook from '@/assets/images/illustrations/themes/Morning_Pages.svg';
import Avatar from '@/components/atoms/avatar';
import Button from '@/components/atoms/button';
import { Header } from '@/components/molecules/header';
import ReadingPickerSheet from '@/components/organisms/reading-picker-sheet';
import ReflectionSheet, { ReflectionData } from '@/components/organisms/reflection-sheet';
import TimerCard from '@/components/organisms/timer-card';
import { useAuth } from '@/contexts/auth-context';
import { useRooms } from '@/contexts/rooms-context';
import { useElapsedSeconds } from '@/hooks/use-elapsed-seconds';
import { useRoomPresence } from '@/hooks/use-room-presence';
import { useTheme } from '@/hooks/use-theme';
import { useLocalSearchParams, useRouter } from 'expo-router';

export default function SilentRoomScreen() {
    const { id } = useLocalSearchParams<{ id: string }>();
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

    const roomElapsedSeconds = useElapsedSeconds(room?.started_at);

    const bottomSheetRef = useRef<BottomSheet>(null);
    const reflectionSheetRef = useRef<BottomSheet>(null);
    const readingPickerRef = useRef<BottomSheet>(null);
    const snapPoints = ['40%', '75%'];

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
                if (existingMember) return attemptJoin(existingMember.book_id)
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
        bottomSheetRef.current?.snapToIndex(0);
    };

    const renderBackdrop = useCallback(
        (props: BottomSheetBackdropProps) => (
            <BottomSheetBackdrop
                {...props}
                appearsOnIndex={0}
                disappearsOnIndex={-1}
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
        <View style={{ flex: 1, backgroundColor: colors.creme }}>
            <Header
                title=''
                showBack
                right={hasCheckedMembership && !isJoined ? (
                    <Button title="Join" size="small" onPress={handleJoinPress} />
                ) : undefined}
            />
            <View style={{ flex: 1 }}>
                <Animated.View style={styles.illustration}>
                    <ReadingBook width='100%' height='100%' />
                </Animated.View>
                <TimerCard
                    elapsedSeconds={roomElapsedSeconds}
                    duration={room?.duration_minutes ?? 0}
                    memberCount={memberCount}
                    onPress={openDetails}
                />
            </View>

            <BottomSheet
                ref={bottomSheetRef}
                index={-1}
                snapPoints={snapPoints}
                enablePanDownToClose
                backdropComponent={renderBackdrop}
                backgroundStyle={styles.sheetBackground}
                handleIndicatorStyle={styles.handleIndicator}
            >
                <BottomSheetView style={styles.sheetContent}>
                    <View style={styles.sheetHeader}>
                        <Text style={styles.sheetTitle}>{room?.name ?? 'Room details'}</Text>
                        {room?.description && (
                            <Text style={styles.sheetDescription}>{room.description}</Text>
                        )}
                    </View>

                    <View style={styles.section}>
                        <Text style={styles.sectionLabel}>
                            Reading with {memberCount} {memberCount === 1 ? 'person' : 'people'}
                        </Text>
                        {members?.map((member) => {
                            const currentBook = memberBooks[member.user_id]
                            const label = currentBook ? `Reading ${currentBook.title}` : 'No book selected'
                            const isSelf = member.user_id === userId

                            return (
                                <View key={member.user_id} style={styles.memberRow}>
                                    <Avatar id={member.user_id} size="medium" />
                                    {isSelf && !currentBook ? (
                                        <TouchableOpacity style={{ flex: 1 }} onPress={openReadingPicker}>
                                            <Text style={[styles.memberBook, styles.memberBookLink]} numberOfLines={1}>
                                                {label}
                                            </Text>
                                        </TouchableOpacity>
                                    ) : (
                                        <Text style={styles.memberBook} numberOfLines={1}>{label}</Text>
                                    )}
                                </View>
                            )
                        })}
                    </View>
                    {isJoined && (
                        <Button
                            title="Leave room"
                            icon="rectangle.portrait.and.arrow.right"
                            onPress={handleLeaveRoom}
                        />
                    )}
                </BottomSheetView>
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
        height: '82%'
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
    sheetContent: {
        flex: 1,
        paddingHorizontal: 24,
        paddingVertical: 16,
    },
    sheetHeader: {
        marginBottom: 16,
    },
    sheetTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: '#263238',
    },
    sheetDescription: {
        fontSize: 14,
        color: '#8a8378',
        marginTop: 4,
    },
    section: {
        marginBottom: 24,
    },
    sectionLabel: {
        fontSize: 13,
        color: '#8a8378',
        marginBottom: 8,
    },
    memberRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        paddingVertical: 6,
    },
    memberBook: {
        flex: 1,
        fontSize: 15,
        color: '#263238',
    },
    memberBookLink: {
        color: '#f0b429',
        fontWeight: '600',
        textDecorationLine: 'underline',
    },
});
