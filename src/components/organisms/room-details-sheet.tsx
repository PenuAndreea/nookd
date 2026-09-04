import BottomSheet, {
    BottomSheetBackdrop,
    BottomSheetBackdropProps,
    BottomSheetScrollView,
} from '@gorhom/bottom-sheet';
import { router } from 'expo-router';
import { forwardRef, useCallback } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { Book, RoomWithBook } from '@/api/rooms';
import Button from '@/components/atoms/button';
import StatusBadge from '@/components/atoms/status-badge';
import TextButton from '@/components/atoms/text-button';
import BookRow from '@/components/molecules/book-row';
import ReaderList from '@/components/molecules/reader-list';
import { useTheme } from '@/hooks/use-theme';

interface RoomDetailsSheetProps {
    room: RoomWithBook | undefined;
    memberCount: number;
    members: { user_id: string }[];
    userId?: string;
    booksInRoom: { book: Book; count: number }[];
    isJoined: boolean;
    /** Whether the current user already has a book selected for this room. */
    selfHasBook: boolean;
    onAddBook: () => void;
    onLeaveRoom: () => void;
}

// Fixed points, not percentages: the peek should be exactly tall enough for
// its label (which does not scale with screen height), and the expanded
// points were chosen against this content, not derived from it.
const SNAP_POINTS = [80, '58%', '88%'];

/**
 * The room screen's bottom sheet: who is here, what they are reading, and
 * leaving the room. The first snap point is a permanent peek — the sheet is
 * always on screen so this is discoverable without knowing to tap the timer.
 */
const RoomDetailsSheet = forwardRef<BottomSheet, RoomDetailsSheetProps>(
    ({ room, memberCount, members, userId, booksInRoom, isJoined, selfHasBook, onAddBook, onLeaveRoom }, ref) => {
        const colors = useTheme();
        const styles = createStyles(colors);

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

        return (
            <BottomSheet
                ref={ref}
                index={0}
                snapPoints={SNAP_POINTS}
                enablePanDownToClose={false}
                backdropComponent={renderBackdrop}
                backgroundStyle={styles.sheetBackground}
                handleIndicatorStyle={styles.handleIndicator}
            >
                <BottomSheetScrollView contentContainerStyle={styles.content}>
                    <Text style={styles.peekLabel}>Readers &amp; current book</Text>

                    <View style={styles.titleRow}>
                        <Text style={styles.title} numberOfLines={1}>
                            {room?.name ?? 'Room details'}
                        </Text>
                        <StatusBadge memberCount={memberCount} />
                    </View>
                    {room?.description && (
                        <Text style={styles.description}>{room.description}</Text>
                    )}

                    <View style={styles.sectionHeader}>
                        <Text style={styles.sectionTitle}>Readers in the room</Text>
                        <Text style={styles.sectionCount}>{memberCount}</Text>
                    </View>

                    {memberCount === 0 ? (
                        <Text style={styles.emptyHint}>No one is here yet.</Text>
                    ) : (
                        <ReaderList members={members} currentUserId={userId} />
                    )}

                    <Text style={[styles.sectionTitle, styles.readingTitle]}>Currently reading</Text>

                    {booksInRoom.map(({ book, count }) => (
                        <View key={book.id} style={styles.bookCardWrapper}>
                            <BookRow
                                book={book}
                                size="medium"
                                onPress={() => router.push(`/books/${book.id}`)}
                                belowInfo={
                                    <View style={styles.bookCountPill}>
                                        <Text style={styles.bookCountText}>
                                            {count} reading this book
                                        </Text>
                                    </View>
                                }
                            />
                        </View>
                    ))}

                    {isJoined && !selfHasBook && (
                        <TextButton title="+ Add what you're reading" onPress={onAddBook} style={styles.addBookText} />
                    )}

                    {!isJoined && booksInRoom.length === 0 && (
                        <Text style={styles.emptyHint}>Nothing yet.</Text>
                    )}

                    {isJoined && (
                        <View style={styles.leaveButton}>
                            <Button
                                title="Leave room"
                                icon="rectangle.portrait.and.arrow.right"
                                onPress={onLeaveRoom}
                            />
                        </View>
                    )}
                </BottomSheetScrollView>
            </BottomSheet>
        );
    }
);

RoomDetailsSheet.displayName = 'RoomDetailsSheet';

export default RoomDetailsSheet;

const createStyles = (colors: ReturnType<typeof useTheme>) => StyleSheet.create({
    sheetBackground: {
        backgroundColor: colors.white,
        borderTopLeftRadius: 26,
        borderTopRightRadius: 26,
        shadowColor: colors.sheetText,
        shadowOpacity: 0.18,
        shadowRadius: 40,
        shadowOffset: { width: 0, height: -10 },
        elevation: 12,
    },
    handleIndicator: {
        backgroundColor: colors.sheetHandle,
        width: 40,
    },
    content: {
        paddingHorizontal: 24,
        paddingTop: 16,
        paddingBottom: 40,
    },
    // The only thing visible at the peek snap point — a hint of what
    // dragging the sheet up reveals.
    peekLabel: {
        fontSize: 14,
        color: colors.sheetTextSecondary,
        textAlign: 'center',
        marginBottom: 20,
    },
    titleRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 10,
    },
    title: {
        flexShrink: 1,
        fontFamily: 'Lora_700Bold',
        fontSize: 22,
        color: colors.sheetText,
    },
    description: {
        fontSize: 14,
        color: colors.sheetTextSecondary,
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
        color: colors.sheetText,
    },
    sectionCount: {
        fontSize: 16,
        color: colors.sheetTextSecondary,
    },
    readingTitle: {
        marginTop: 22,
        marginBottom: 12,
    },
    bookCardWrapper: {
        marginBottom: 10,
    },
    bookCountPill: {
        alignSelf: 'flex-start',
        marginTop: 6,
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 999,
        backgroundColor: colors.statusQuietBg,
    },
    bookCountText: {
        fontSize: 12,
        color: colors.statusQuietFg,
        fontWeight: '600',
    },
    addBookText: {
        paddingVertical: 12,
    },
    leaveButton: {
        marginTop: 8,
    },
    emptyHint: {
        fontSize: 14,
        color: colors.sheetTextSecondary,
    },
});
