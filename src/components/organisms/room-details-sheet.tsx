import BottomSheet, {
    BottomSheetBackdrop,
    BottomSheetBackdropProps,
    BottomSheetScrollView,
} from '@gorhom/bottom-sheet';
import { router } from 'expo-router';
import { forwardRef, useCallback } from 'react';
import { StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { Book, RoomWithBook } from '@/api/rooms';
import Button from '@/components/atoms/button';
import StatusBadge from '@/components/atoms/status-badge';
import TextButton from '@/components/atoms/text-button';
import Typography from '@/components/atoms/typography';
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
        const { t } = useTranslation();

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
                    <Typography variant="caption" color="sheetTextSecondary" style={styles.peekLabel}>
                        {t('rooms.details.peekLabel')}
                    </Typography>

                    <View style={styles.titleRow}>
                        <Typography variant="title2" color="sheetText" style={styles.title} numberOfLines={1}>
                            {room?.name ?? t('rooms.details.fallbackTitle')}
                        </Typography>
                        <StatusBadge memberCount={memberCount} />
                    </View>
                    {room?.description && (
                        <Typography color="sheetTextSecondary" style={styles.description}>{room.description}</Typography>
                    )}

                    <View style={styles.sectionHeader}>
                        <Typography variant="sectionHeading" color="sheetText">{t('rooms.details.readersSectionTitle')}</Typography>
                        <Typography variant="bodyLarge" color="sheetTextSecondary">{memberCount}</Typography>
                    </View>

                    {memberCount === 0 ? (
                        <Typography color="sheetTextSecondary">{t('rooms.details.noOneHereYet')}</Typography>
                    ) : (
                        <ReaderList members={members} currentUserId={userId} />
                    )}

                    <Typography variant="sectionHeading" color="sheetText" style={styles.readingTitle}>
                        {t('rooms.details.currentlyReadingSectionTitle')}
                    </Typography>

                    {booksInRoom.map(({ book, count }) => (
                        <View key={book.id} style={styles.bookCardWrapper}>
                            <BookRow
                                book={book}
                                size="medium"
                                onPress={() => router.push(`/books/${book.id}`)}
                                belowInfo={
                                    <View style={styles.bookCountPill}>
                                        <Typography variant="smallBold" style={{ color: colors.statusQuietFg }}>
                                            {t('rooms.details.readingThisBook', { count })}
                                        </Typography>
                                    </View>
                                }
                            />
                        </View>
                    ))}

                    {isJoined && !selfHasBook && (
                        <TextButton title={t('rooms.details.addWhatYoureReading')} onPress={onAddBook} style={styles.addBookText} />
                    )}

                    {!isJoined && booksInRoom.length === 0 && (
                        <Typography color="sheetTextSecondary">{t('rooms.details.nothingYet')}</Typography>
                    )}

                    {isJoined && (
                        <View style={styles.leaveButton}>
                            <Button
                                title={t('rooms.details.leaveRoom')}
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
    },
    description: {
        marginTop: 4,
    },
    sectionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginTop: 22,
        marginBottom: 12,
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
    addBookText: {
        paddingVertical: 12,
    },
    leaveButton: {
        marginTop: 8,
    },
});
