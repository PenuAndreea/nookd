import { useTranslation } from 'react-i18next';
import { FlatList, StyleSheet, View } from 'react-native';

import { UserBookWithBook } from '@/api/books';
import Typography from '@/components/atoms/typography';
import { EmptyState } from '@/components/molecules/empty-state';
import { ErrorState } from '@/components/molecules/error-state';
import { LibraryFilter, LibraryFilterChips } from '@/components/molecules/library-filter-chips';
import BookItem from '@/components/organisms/book-item';
import { BottomTabInset, Spacing } from '@/constants/theme';

interface BookLibraryListProps {
    books: UserBookWithBook[];
    filter: LibraryFilter;
    onFilterChange: (filter: LibraryFilter) => void;
    loadingList: boolean;
    listError: boolean;
    onRetry: () => void;
}

/**
 * Everything the reader owns, filtered by reading status. Lives on the
 * Library's white panel, so its text uses the fixed `sheet*` tokens.
 */
export default function BookLibraryList({
    books,
    filter,
    onFilterChange,
    loadingList,
    listError,
    onRetry,
}: BookLibraryListProps) {
    const { t } = useTranslation();

    return (
        <FlatList
            data={books}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
            ListHeaderComponent={
                <View style={styles.header}>
                    <Typography variant="title2" color="sheetText">{t('books.myLibrary')}</Typography>
                    <LibraryFilterChips value={filter} onChange={onFilterChange} />
                </View>
            }
            ListEmptyComponent={loadingList ? null : listError ? (
                <ErrorState
                    title={t('books.listErrorTitle')}
                    subtitle={t('books.listErrorSubtitle')}
                    onRetry={onRetry}
                />
            ) : (
                <EmptyState title={t('books.emptyLibraryTitle')} subtitle={t('books.emptyLibrarySubtitle')} />
            )}
            renderItem={({ item }) => <BookItem userBook={item} />}
        />
    );
}

const styles = StyleSheet.create({
    listContent: {
        paddingBottom: BottomTabInset + Spacing.four,
    },
    header: {
        gap: Spacing.three,
        paddingBottom: Spacing.two,
    },
});
