import BottomSheet, {
    BottomSheetBackdrop,
    BottomSheetBackdropProps,
    BottomSheetFlatList,
} from '@gorhom/bottom-sheet';
import { forwardRef, useCallback } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { UserBookWithBook } from '@/api/books';
import TextButton from '@/components/atoms/text-button';
import BookRow from '@/components/molecules/book-row';
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
        const { t } = useTranslation();

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
                            <Text style={styles.title}>{t('rooms.readingPicker.title')}</Text>
                            <Text style={styles.subtitle}>
                                {t('rooms.readingPicker.subtitle')}
                            </Text>
                        </View>
                    }
                    ListEmptyComponent={
                        <EmptyState title={t('rooms.readingPicker.emptyLibraryTitle')} subtitle={t('rooms.readingPicker.emptyLibrarySubtitle')} />
                    }
                    renderItem={({ item }) => (
                        <View style={styles.bookRowSpacing}>
                            <BookRow book={item.book} onPress={() => onSelect(item.book_id)} />
                        </View>
                    )}
                    ListFooterComponent={
                        <View style={styles.footer}>
                            <TextButton
                                title={t('rooms.readingPicker.notReadingSpecific')}
                                variant="secondary"
                                onPress={onSkip}
                            />
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
    header: {
        paddingBottom: 12,
        gap: 4,
    },
    title: {
        fontSize: 18,
        fontWeight: '600',
        color: colors.sheetText,
    },
    subtitle: {
        fontSize: 13,
        color: colors.sheetTextSecondary,
    },
    listContent: {
        paddingHorizontal: 24,
        paddingTop: 16,
        paddingBottom: 16,
    },
    bookRowSpacing: {
        paddingVertical: 4,
    },
    footer: {
        paddingTop: 8,
        alignItems: 'center',
    },
});
