import { FlatList, StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { UserBookStatus, UserBookWithBook } from '@/api/books';
import Typography from '@/components/atoms/typography';
import BookCarousel, { BookCarouselItem } from '@/components/molecules/book-carousel';
import { BookStatusChips } from '@/components/molecules/book-status-chips';
import { EmptyState } from '@/components/molecules/empty-state';
import { ErrorState } from '@/components/molecules/error-state';
import BookItem from '@/components/organisms/book-item';
import { Spacing } from '@/constants/theme';
import { router } from 'expo-router';

interface BookLibraryListProps {
    activelyReadItems: BookCarouselItem[];
    popularBookItems: BookCarouselItem[];
    status: UserBookStatus;
    onStatusChange: (status: UserBookStatus) => void;
    userBooks: UserBookWithBook[];
    loadingList: boolean;
    listError: boolean;
    onRetry: () => void;
}

/** The Books tab's default view: discovery shelves above the user's own status-filtered library. */
export default function BookLibraryList({
    activelyReadItems,
    popularBookItems,
    status,
    onStatusChange,
    userBooks,
    loadingList,
    listError,
    onRetry,
}: BookLibraryListProps) {
    const { t } = useTranslation();

    return (
        <FlatList
            data={userBooks}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.listContent}
            ListHeaderComponent={
                <View>
                    <BookCarousel
                        title={t('books.othersReading')}
                        items={activelyReadItems}
                        onPressItem={(bookId) => router.navigate(`/books/${bookId}`)}
                    />
                    <BookCarousel
                        title={t('books.popularBooks')}
                        items={popularBookItems}
                        onPressItem={(bookId) => router.navigate(`/books/${bookId}`)}
                    />

                    <Typography variant="sectionLabel" color="textSecondary" style={styles.libraryLabel}>
                        {t('books.myLibrary')}
                    </Typography>

                    <BookStatusChips value={status} onChange={onStatusChange} equalWidth />
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
        paddingBottom: Spacing.five,
    },
    libraryLabel: {
        marginBottom: Spacing.two,
    },
});
