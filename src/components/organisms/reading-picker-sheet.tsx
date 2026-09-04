import BottomSheet, {
    BottomSheetBackdrop,
    BottomSheetBackdropProps,
    BottomSheetFlatList,
} from '@gorhom/bottom-sheet';
import { forwardRef, useCallback } from 'react';
import { StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { UserBookWithBook } from '@/api/books';
import TextButton from '@/components/atoms/text-button';
import Typography from '@/components/atoms/typography';
import BookRow from '@/components/molecules/book-row';
import { EmptyState } from '@/components/molecules/empty-state';
import { ErrorState } from '@/components/molecules/error-state';
import { useTheme } from '@/hooks/use-theme';

interface ReadingPickerSheetProps {
    books: UserBookWithBook[];
    /** The library fetch failed — shown instead of the "empty library" message so a fetch error isn't mistaken for having no books. */
    error?: boolean;
    onRetry?: () => void;
    onSelect: (bookId: string) => void;
    onSkip: () => void;
}

const ReadingPickerSheet = forwardRef<BottomSheet, ReadingPickerSheetProps>(
    ({ books, error, onRetry, onSelect, onSkip }, ref) => {
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
                            <Typography variant="sheetTitle" color="sheetText">{t('rooms.readingPicker.title')}</Typography>
                            <Typography variant="caption" color="sheetTextSecondary">
                                {t('rooms.readingPicker.subtitle')}
                            </Typography>
                        </View>
                    }
                    ListEmptyComponent={error ? (
                        <ErrorState
                            title={t('rooms.readingPicker.loadErrorTitle')}
                            subtitle={t('rooms.readingPicker.loadErrorSubtitle')}
                            onRetry={onRetry}
                        />
                    ) : (
                        <EmptyState title={t('rooms.readingPicker.emptyLibraryTitle')} subtitle={t('rooms.readingPicker.emptyLibrarySubtitle')} />
                    )}
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
