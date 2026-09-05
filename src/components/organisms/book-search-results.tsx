import { FlatList, Pressable, StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { OpenLibraryResult } from '@/api/books';
import Typography from '@/components/atoms/typography';
import { EmptyState } from '@/components/molecules/empty-state';
import { ErrorState } from '@/components/molecules/error-state';
import BookRow from '@/components/molecules/book-row';
import { BorderRadius, BottomTabInset, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

interface BookSearchResultsProps {
    query: string;
    results: OpenLibraryResult[];
    searching: boolean;
    searchError: boolean;
    addingKey: string | null;
    onRetry: () => void;
    onOpen: (result: OpenLibraryResult) => void;
    onQuickAdd: (result: OpenLibraryResult) => void;
}

/** The search-as-you-type results list on the Books tab, with a per-row "Add" shortcut. */
export default function BookSearchResults({
    query,
    results,
    searching,
    searchError,
    addingKey,
    onRetry,
    onOpen,
    onQuickAdd,
}: BookSearchResultsProps) {
    const colors = useTheme();
    const styles = createStyles(colors);
    const { t } = useTranslation();

    return (
        <FlatList
            data={results}
            keyExtractor={(item) => item.openLibraryKey}
            contentContainerStyle={styles.listContent}
            keyboardShouldPersistTaps="handled"
            ListEmptyComponent={searching ? null : searchError ? (
                <ErrorState
                    title={t('books.searchErrorTitle')}
                    subtitle={t('books.searchErrorSubtitle')}
                    onRetry={onRetry}
                />
            ) : (
                <EmptyState title={t('books.noBooksFoundTitle')} subtitle={t('books.noBooksFoundSubtitle', { query })} />
            )}
            renderItem={({ item }) => (
                <View style={styles.searchResultSpacing}>
                    <BookRow
                        book={{ title: item.title, author: item.author, cover_url: item.coverUrl }}
                        onPress={() => onOpen(item)}
                        disabled={addingKey === item.openLibraryKey}
                        trailing={
                            <Pressable
                                style={styles.addChip}
                                onPress={() => onQuickAdd(item)}
                                disabled={addingKey === item.openLibraryKey}
                                hitSlop={8}
                            >
                                <Typography variant="smallBold" color="sheetText">
                                    {addingKey === item.openLibraryKey ? t('books.adding') : t('books.addChip')}
                                </Typography>
                            </Pressable>
                        }
                    />
                </View>
            )}
        />
    );
}

const createStyles = (colors: ReturnType<typeof useTheme>) => StyleSheet.create({
    listContent: {
        paddingBottom: BottomTabInset + Spacing.four,
    },
    searchResultSpacing: {
        marginBottom: Spacing.two,
    },
    addChip: {
        backgroundColor: colors.progressTrack,
        borderRadius: BorderRadius.full,
        paddingHorizontal: 10,
        paddingVertical: 6,
    },
});
