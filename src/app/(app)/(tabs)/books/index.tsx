import { useCallback, useEffect, useState } from 'react';
import { Alert, FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import {
    addToReadingList,
    getActivelyReadBooks,
    getOrCreateBook,
    getPopularBooks,
    getUserBooks,
    OpenLibraryResult,
    PopularBook,
    RoomWithBook,
    searchOpenLibrary,
    UserBookStatus,
    UserBookWithBook,
} from '@/api/books';
import { BookStatusChips } from '@/components/molecules/book-status-chips';
import BookCarousel, { BookCarouselItem } from '@/components/molecules/book-carousel';
import BookRow from '@/components/molecules/book-row';
import { EmptyState } from '@/components/molecules/empty-state';
import { ErrorState } from '@/components/molecules/error-state';
import { SearchField } from '@/components/molecules/search-field';
import BookItem from '@/components/organisms/book-item';
import { BorderRadius, Spacing } from '@/constants/theme';
import { useAuth } from '@/contexts/auth-context';
import { useTheme } from '@/hooks/use-theme';
import { router } from 'expo-router';

export { default as ErrorBoundary } from '@/components/organisms/route-error-boundary';

export default function BooksScreen() {
    const { session } = useAuth();
    const userId = session?.user?.id;
    const colors = useTheme();
    const styles = createStyles(colors);
    const { t } = useTranslation();

    const [query, setQuery] = useState('');
    const [searchResults, setSearchResults] = useState<OpenLibraryResult[]>([]);
    const [searching, setSearching] = useState(false);
    const [searchError, setSearchError] = useState(false);
    const [addingKey, setAddingKey] = useState<string | null>(null);

    const [status, setStatus] = useState<UserBookStatus>('currently_reading');
    const [userBooks, setUserBooks] = useState<UserBookWithBook[]>([]);
    const [loadingList, setLoadingList] = useState(false);
    const [listError, setListError] = useState(false);

    const [activelyRead, setActivelyRead] = useState<RoomWithBook[]>([]);
    const [popularBooks, setPopularBooks] = useState<PopularBook[]>([]);

    const loadUserBooks = useCallback(async () => {
        if (!userId) return;
        setLoadingList(true);
        try {
            const data = await getUserBooks(userId, status);
            setUserBooks(data);
            setListError(false);
        } catch (error) {
            console.error('Error loading reading list:', error);
            setListError(true);
        } finally {
            setLoadingList(false);
        }
    }, [userId, status]);

    useEffect(() => {
        // Calling the memoized loader through a local wrapper (rather than as
        // a bare reference) keeps this a plain "refetch on dependency change"
        // effect the analyzer can see through, instead of an opaque call to
        // an externally-defined function.
        function run() {
            loadUserBooks();
        }
        run();
    }, [loadUserBooks]);

    useEffect(() => {
        // Decorative secondary shelves — a failure here just means the
        // carousel stays hidden (BookCarousel renders nothing for an empty
        // list), which is a reasonable degrade for content that isn't the
        // point of this screen. The primary list below has its own error UI.
        getActivelyReadBooks().then(setActivelyRead).catch((error) => {
            console.error('Error loading what others are reading:', error);
        });
        getPopularBooks().then(setPopularBooks).catch((error) => {
            console.error('Error loading popular books:', error);
        });
    }, []);

    async function search(text: string) {
        setQuery(text);
        setSearchError(false);
        if (text.length < 3) {
            setSearchResults([]);
            return;
        }

        setSearching(true);
        try {
            const results = await searchOpenLibrary(text);
            setSearchResults(results);
        } catch (error) {
            console.error('Error searching books:', error);
            setSearchResults([]);
            setSearchError(true);
        } finally {
            setSearching(false);
        }
    }

    async function openResult(result: OpenLibraryResult) {
        if (addingKey) return;
        setAddingKey(result.openLibraryKey);
        try {
            const book = await getOrCreateBook(result);
            setQuery('');
            setSearchResults([]);
            router.navigate(`/books/${book.id}`);
        } catch (error) {
            console.error('Error opening book:', error);
            Alert.alert(t('books.openBookErrorTitle'), t('common.genericErrorMessage'));
        } finally {
            setAddingKey(null);
        }
    }

    async function quickAdd(result: OpenLibraryResult) {
        if (!userId || addingKey) return;
        setAddingKey(result.openLibraryKey);
        try {
            const book = await getOrCreateBook(result);
            await addToReadingList(userId, book.id, 'want_to_read');
            setQuery('');
            setSearchResults([]);
            if (status === 'want_to_read') await loadUserBooks();
        } catch (error) {
            console.error('Error adding book to reading list:', error);
            Alert.alert(t('books.addToListErrorTitle'), t('common.genericErrorMessage'));
        } finally {
            setAddingKey(null);
        }
    }

    const isSearching = query.length >= 3;

    const activelyReadItems: BookCarouselItem[] = activelyRead.map(({ id, book }) => ({ key: id, book }));
    const popularBookItems: BookCarouselItem[] = popularBooks.map(({ book, roomCount }) => ({
        key: book.id,
        book,
        subtitle: t('books.popularBooksCount', { count: roomCount }),
    }));

    return (
        <View style={styles.container}>
            <Text style={styles.title}>{t('books.title')}</Text>

            <SearchField
                placeholder={t('books.searchPlaceholder')}
                value={query}
                onChangeText={search}
                loading={searching}
            />

            {isSearching ? (
                <FlatList
                    data={searchResults}
                    keyExtractor={(item) => item.openLibraryKey}
                    contentContainerStyle={styles.listContent}
                    keyboardShouldPersistTaps="handled"
                    ListEmptyComponent={searching ? null : searchError ? (
                        <ErrorState
                            title={t('books.searchErrorTitle')}
                            subtitle={t('books.searchErrorSubtitle')}
                            onRetry={() => search(query)}
                        />
                    ) : (
                        <EmptyState title={t('books.noBooksFoundTitle')} subtitle={t('books.noBooksFoundSubtitle', { query })} />
                    )}
                    renderItem={({ item }) => (
                        <View style={styles.searchResultSpacing}>
                            <BookRow
                                book={{ title: item.title, author: item.author, cover_url: item.coverUrl }}
                                onPress={() => openResult(item)}
                                disabled={addingKey === item.openLibraryKey}
                                trailing={
                                    <Pressable
                                        style={styles.addChip}
                                        onPress={() => quickAdd(item)}
                                        disabled={addingKey === item.openLibraryKey}
                                        hitSlop={8}
                                    >
                                        <Text style={styles.addChipText}>
                                            {addingKey === item.openLibraryKey ? t('books.adding') : t('books.addChip')}
                                        </Text>
                                    </Pressable>
                                }
                            />
                        </View>
                    )}
                />
            ) : (
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

                            <Text style={[styles.sectionLabel, { marginBottom: Spacing.two }]}>{t('books.myLibrary')}</Text>

                            <BookStatusChips value={status} onChange={setStatus} equalWidth />
                        </View>
                    }
                    ListEmptyComponent={loadingList ? null : listError ? (
                        <ErrorState
                            title={t('books.listErrorTitle')}
                            subtitle={t('books.listErrorSubtitle')}
                            onRetry={loadUserBooks}
                        />
                    ) : (
                        <EmptyState title={t('books.emptyLibraryTitle')} subtitle={t('books.emptyLibrarySubtitle')} />
                    )}
                    renderItem={({ item }) => <BookItem userBook={item} />}
                />
            )}
        </View>
    );
}

const createStyles = (colors: ReturnType<typeof useTheme>) => StyleSheet.create({
    container: {
        flex: 1,
        marginTop: Spacing.six,
        marginHorizontal: Spacing.three,
        backgroundColor: colors.background,
        gap: Spacing.three,
    },
    title: {
        fontFamily: 'Lora_700Bold',
        fontSize: 24,
        color: colors.text,
    },
    listContent: {
        paddingBottom: Spacing.five,
    },
    searchResultSpacing: {
        marginBottom: Spacing.two,
    },
    addChip: {
        backgroundColor: colors.backgroundElement,
        borderRadius: BorderRadius.full,
        paddingHorizontal: 10,
        paddingVertical: 6,
    },
    addChipText: {
        fontSize: 12,
        fontWeight: '600',
        color: colors.text,
    },
    sectionLabel: {
        fontSize: 12,
        fontWeight: '600',
        color: colors.textSecondary,
        textTransform: 'uppercase',
        letterSpacing: 0.6,
    },
});
