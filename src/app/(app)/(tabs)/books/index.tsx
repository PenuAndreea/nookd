import { useCallback, useEffect, useState } from 'react';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';

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
import { SearchField } from '@/components/molecules/search-field';
import BookItem from '@/components/organisms/book-item';
import { BorderRadius, Spacing } from '@/constants/theme';
import { useAuth } from '@/contexts/auth-context';
import { useTheme } from '@/hooks/use-theme';
import { router } from 'expo-router';

export default function BooksScreen() {
    const { session } = useAuth();
    const userId = session?.user?.id;
    const colors = useTheme();
    const styles = createStyles(colors);

    const [query, setQuery] = useState('');
    const [searchResults, setSearchResults] = useState<OpenLibraryResult[]>([]);
    const [searching, setSearching] = useState(false);
    const [addingKey, setAddingKey] = useState<string | null>(null);

    const [status, setStatus] = useState<UserBookStatus>('currently_reading');
    const [userBooks, setUserBooks] = useState<UserBookWithBook[]>([]);
    const [loadingList, setLoadingList] = useState(false);

    const [activelyRead, setActivelyRead] = useState<RoomWithBook[]>([]);
    const [popularBooks, setPopularBooks] = useState<PopularBook[]>([]);

    const loadUserBooks = useCallback(async () => {
        if (!userId) return;
        setLoadingList(true);
        try {
            const data = await getUserBooks(userId, status);
            setUserBooks(data);
        } catch (error) {
            console.error('Error loading reading list:', error);
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
        getActivelyReadBooks().then(setActivelyRead).catch((error) => {
            console.error('Error loading what others are reading:', error);
        });
        getPopularBooks().then(setPopularBooks).catch((error) => {
            console.error('Error loading popular books:', error);
        });
    }, []);

    async function search(text: string) {
        setQuery(text);
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
        } finally {
            setAddingKey(null);
        }
    }

    const isSearching = query.length >= 3;

    const activelyReadItems: BookCarouselItem[] = activelyRead.map(({ id, book }) => ({ key: id, book }));
    const popularBookItems: BookCarouselItem[] = popularBooks.map(({ book, roomCount }) => ({
        key: book.id,
        book,
        subtitle: `${roomCount} ${roomCount === 1 ? 'room' : 'rooms'}`,
    }));

    return (
        <View style={styles.container}>
            <Text style={styles.title}>Books</Text>

            <SearchField
                placeholder="Search by title or author"
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
                    ListEmptyComponent={!searching ? (
                        <EmptyState title="No books found" subtitle={`Nothing matched "${query}".`} />
                    ) : null}
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
                                            {addingKey === item.openLibraryKey ? '...' : '+ Add'}
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
                                title="What others are currently reading"
                                items={activelyReadItems}
                                onPressItem={(bookId) => router.navigate(`/books/${bookId}`)}
                            />
                            <BookCarousel
                                title="Popular books"
                                items={popularBookItems}
                                onPressItem={(bookId) => router.navigate(`/books/${bookId}`)}
                            />

                            <Text style={[styles.sectionLabel, { marginBottom: Spacing.two }]}>My Library</Text>

                            <BookStatusChips value={status} onChange={setStatus} equalWidth />
                        </View>
                    }
                    ListEmptyComponent={!loadingList ? (
                        <EmptyState title="Nothing here yet" subtitle="Search above to add a book." />
                    ) : null}
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
