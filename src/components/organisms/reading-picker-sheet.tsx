import BottomSheet, {
    BottomSheetBackdrop,
    BottomSheetBackdropProps,
    BottomSheetFlatList,
} from '@gorhom/bottom-sheet';
import { forwardRef, useCallback } from 'react';
import { Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { UserBookWithBook } from '@/api/books';
import { EmptyState } from '@/components/molecules/empty-state';
import { useTheme } from '@/hooks/use-theme';

interface ReadingPickerSheetProps {
    books: UserBookWithBook[];
    onSelect: (bookId: string) => void;
    onSkip: () => void;
}

const ReadingPickerSheet = forwardRef<BottomSheet, ReadingPickerSheetProps>(
    ({ books, onSelect, onSkip }, ref) => {
        const colors = useTheme();
        const styles = createStyles(colors);

        const renderBackdrop = useCallback(
            (props: BottomSheetBackdropProps) => (
                <BottomSheetBackdrop
                    {...props}
                    appearsOnIndex={0}
                    disappearsOnIndex={-1}
                    pressBehavior="none"
                    opacity={0.35}
                />
            ),
            []
        );

        return (
            <BottomSheet
                ref={ref}
                index={-1}
                snapPoints={['60%']}
                enablePanDownToClose={false}
                backdropComponent={renderBackdrop}
                backgroundStyle={styles.sheetBackground}
                handleIndicatorStyle={styles.handleIndicator}
            >
                <BottomSheetFlatList
                    data={books}
                    keyExtractor={(item) => item.id}
                    contentContainerStyle={styles.listContent}
                    ListHeaderComponent={
                        <View style={styles.header}>
                            <Text style={styles.title}>What are you reading?</Text>
                            <Text style={styles.subtitle}>
                                Optional — shown to others in the room as a nice-to-know, not tracked.
                            </Text>
                        </View>
                    }
                    ListEmptyComponent={
                        <EmptyState title="Your library is empty" subtitle="Nothing to pick from yet." />
                    }
                    renderItem={({ item }) => (
                        // TODO: this should be a proper list item component, not just a touchable row. Separate component
                        <TouchableOpacity
                            style={styles.bookRow}
                            onPress={() => onSelect(item.book_id)}
                            activeOpacity={0.7}
                        >
                            {item.book.cover_url ? (
                                <Image source={{ uri: item.book.cover_url }} style={styles.cover} />
                            ) : (
                                <View style={styles.coverPlaceholder}>
                                    <Text style={{ fontSize: 18 }}>📖</Text>
                                </View>
                            )}
                            <View style={styles.bookInfo}>
                                <Text style={styles.bookTitle} numberOfLines={1}>{item.book.title}</Text>
                                {item.book.author && (
                                    <Text style={styles.bookAuthor} numberOfLines={1}>{item.book.author}</Text>
                                )}
                            </View>
                        </TouchableOpacity>
                    )}
                    ListFooterComponent={
                        <View style={styles.footer}>
                            <TouchableOpacity onPress={onSkip} style={styles.skipButton}>
                                <Text style={styles.skipText}>Not reading anything specific</Text>
                            </TouchableOpacity>
                        </View>
                    }
                />
            </BottomSheet>
        );
    }
);

ReadingPickerSheet.displayName = 'ReadingPickerSheet';

export default ReadingPickerSheet;

const createStyles = (colors: ReturnType<typeof useTheme>) => StyleSheet.create({
    sheetBackground: {
        backgroundColor: '#fff',
        borderTopLeftRadius: 26,
        borderTopRightRadius: 26,
        shadowColor: '#263238',
        shadowOpacity: 0.18,
        shadowRadius: 40,
        shadowOffset: { width: 0, height: -10 },
        elevation: 12,
    },
    handleIndicator: {
        backgroundColor: '#d8d2c4',
        width: 40,
    },
    header: {
        paddingBottom: 12,
        gap: 4,
    },
    title: {
        fontSize: 18,
        fontWeight: '600',
        color: colors.text,
    },
    subtitle: {
        fontSize: 13,
        color: colors.textSecondary,
    },
    listContent: {
        paddingHorizontal: 24,
        paddingTop: 16,
        paddingBottom: 16,
        gap: 4,
    },
    bookRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        paddingVertical: 8,
    },
    cover: {
        width: 40,
        height: 56,
        borderRadius: 4,
    },
    coverPlaceholder: {
        width: 40,
        height: 56,
        borderRadius: 4,
        backgroundColor: colors.backgroundElement,
        alignItems: 'center',
        justifyContent: 'center',
    },
    bookInfo: {
        flex: 1,
    },
    bookTitle: {
        fontSize: 14,
        fontWeight: '600',
        color: colors.text,
    },
    bookAuthor: {
        fontSize: 13,
        color: colors.textSecondary,
        marginTop: 2,
    },
    footer: {
        paddingTop: 8,
        alignItems: 'center',
    },
    skipButton: {
        padding: 8,
    },
    skipText: {
        fontSize: 14,
        color: colors.textSecondary,
        fontWeight: '600',
    },
});
