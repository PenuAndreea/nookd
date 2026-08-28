import { useCallback, useEffect, useState } from 'react';
import {
    ActivityIndicator,
    FlatList,
    Image,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';

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
import BookItem from '@/components/organisms/book-item';
import { BorderRadius, Spacing } from '@/constants/theme';
import { useAuth } from '@/contexts/auth-context';
import { useTheme } from '@/hooks/use-theme';
import { router } from 'expo-router';

const STATUS_FILTERS: { id: UserBookStatus; label: string }[] = [
    { id: 'want_to_read', label: 'Want to read' },
    { id: 'currently_reading', label: 'Currently reading' },
    { id: 'finished', label: 'Finished' },
];

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
        loadUserBooks();
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

    return (
        <View style={styles.container}>
            <Text style={styles.title}>Books</Text>

            <View style={styles.inputWrapper}>
                <Text style={styles.searchIcon}>🔍</Text>
                <TextInput
                    style={styles.input}
                    placeholder="Search by title or author"
                    placeholderTextColor={colors.textSecondary}
                    value={query}
                    onChangeText={search}
                />
                {searching && <ActivityIndicator size="small" color={colors.accent} />}
            </View>

            {isSearching ? (
                <FlatList
                    data={searchResults}
                    keyExtractor={(item) => item.openLibraryKey}
                    contentContainerStyle={styles.listContent}
                    keyboardShouldPersistTaps="handled"
                    ListEmptyComponent={!searching ? (
                        <Text style={styles.emptyText}>No books found for &quot;{query}&quot;</Text>
                    ) : null}
                    renderItem={({ item }) => (
                        <TouchableOpacity
                            style={styles.searchResult}
                            onPress={() => openResult(item)}
                            disabled={addingKey === item.openLibraryKey}
                            activeOpacity={0.7}
                        >
                            {item.coverUrl ? (
                                <Image source={{ uri: item.coverUrl }} style={styles.searchResultCover} resizeMode="contain" />
                            ) : (
                                <View style={styles.searchResultCoverPlaceholder}>
                                    <Text style={{ fontSize: 18 }}>📖</Text>
                                </View>
                            )}
                            <View style={styles.searchResultInfo}>
                                <Text style={styles.searchResultTitle} numberOfLines={1}>{item.title}</Text>
                                <Text style={styles.searchResultAuthor} numberOfLines={1}>{item.author}</Text>
                            </View>
                            <TouchableOpacity
                                style={styles.addChip}
                                onPress={() => quickAdd(item)}
                                disabled={addingKey === item.openLibraryKey}
                                hitSlop={8}
                            >
                                <Text style={styles.addChipText}>
                                    {addingKey === item.openLibraryKey ? '...' : '+ Add'}
                                </Text>
                            </TouchableOpacity>
                        </TouchableOpacity>
                    )}
                />
            ) : (
                <FlatList
                    data={userBooks}
                    keyExtractor={(item) => item.id}
                    contentContainerStyle={styles.listContent}
                    ListHeaderComponent={
                        <View>
                            {activelyRead.length > 0 && (
                                <View style={styles.activelyReadSection}>
                                    <Text style={styles.sectionLabel}>What others are currently reading</Text>
                                    <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                                        {activelyRead.map(({ id, book }) => (
                                            <TouchableOpacity
                                                key={id}
                                                style={styles.activelyReadCard}
                                                onPress={() => router.navigate(`/books/${book.id}`)}
                                                activeOpacity={0.7}
                                            >
                                                {book.cover_url ? (
                                                    <Image source={{ uri: book.cover_url }} style={styles.activelyReadCover} resizeMode="contain" />
                                                ) : (
                                                    <View style={styles.activelyReadCoverPlaceholder}>
                                                        <Text style={{ fontSize: 20 }}>📖</Text>
                                                    </View>
                                                )}
                                                <Text style={styles.activelyReadTitle} numberOfLines={2}>{book.title}</Text>
                                            </TouchableOpacity>
                                        ))}
                                    </ScrollView>
                                </View>
                            )}

                            {popularBooks.length > 0 && (
                                <View style={styles.activelyReadSection}>
                                    <Text style={styles.sectionLabel}>Popular books</Text>
                                    <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                                        {popularBooks.map(({ book, roomCount }) => (
                                            <TouchableOpacity
                                                key={book.id}
                                                style={styles.activelyReadCard}
                                                onPress={() => router.navigate(`/books/${book.id}`)}
                                                activeOpacity={0.7}
                                            >
                                                {book.cover_url ? (
                                                    <Image source={{ uri: book.cover_url }} style={styles.activelyReadCover} resizeMode="contain" />
                                                ) : (
                                                    <View style={styles.activelyReadCoverPlaceholder}>
                                                        <Text style={{ fontSize: 20 }}>📖</Text>
                                                    </View>
                                                )}
                                                <Text style={styles.activelyReadTitle} numberOfLines={2}>{book.title}</Text>
                                                <Text style={styles.popularCount}>
                                                    {roomCount} {roomCount === 1 ? 'room' : 'rooms'}
                                                </Text>
                                            </TouchableOpacity>
                                        ))}
                                    </ScrollView>
                                </View>
                            )}

                            <Text style={[styles.sectionLabel, { marginBottom: Spacing.two }]}>My Library</Text>

                            <View style={styles.filterRow}>
                                {STATUS_FILTERS.map((filter) => {
                                    const selected = status === filter.id;
                                    return (
                                        <TouchableOpacity
                                            key={filter.id}
                                            style={[styles.filterChip, selected && styles.filterChipSelected]}
                                            onPress={() => setStatus(filter.id)}
                                            activeOpacity={0.7}
                                        >
                                            <Text style={[styles.filterText, selected && styles.filterTextSelected]}>
                                                {filter.label}
                                            </Text>
                                        </TouchableOpacity>
                                    );
                                })}
                            </View>
                        </View>
                    }
                    ListEmptyComponent={!loadingList ? (
                        <Text style={styles.emptyText}>
                            Nothing here yet — search above to add a book.
                        </Text>
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
        fontFamily: 'PlayfairDisplay_800ExtraBold',
        fontSize: 24,
        fontWeight: '700',
        color: colors.text,
    },
    inputWrapper: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: colors.white,
        borderRadius: BorderRadius.medium,
        borderWidth: 0.5,
        borderColor: colors.background,
        paddingHorizontal: 14,
        gap: 10,
    },
    searchIcon: {
        fontSize: 16,
    },
    input: {
        flex: 1,
        fontSize: 15,
        color: colors.text,
        paddingVertical: 13,
    },
    listContent: {
        paddingBottom: Spacing.five,
    },
    emptyText: {
        color: colors.textSecondary,
        textAlign: 'center',
        marginTop: Spacing.five,
        fontSize: 14,
    },

    // Search results
    searchResult: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: colors.white,
        borderRadius: BorderRadius.medium,
        borderWidth: 0.5,
        borderColor: colors.background,
        padding: 12,
        gap: 12,
        marginBottom: Spacing.two,
    },
    searchResultCover: {
        width: 36,
        height: 48,
        borderRadius: 4,
    },
    searchResultCoverPlaceholder: {
        width: 36,
        height: 48,
        borderRadius: 4,
        backgroundColor: colors.backgroundElement,
        alignItems: 'center',
        justifyContent: 'center',
    },
    searchResultInfo: {
        flex: 1,
    },
    searchResultTitle: {
        fontSize: 14,
        fontWeight: '600',
        color: colors.text,
    },
    searchResultAuthor: {
        fontSize: 13,
        color: colors.textSecondary,
        marginTop: 2,
    },
    addChip: {
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderRadius: BorderRadius.full,
        backgroundColor: colors.backgroundElement,
    },
    addChipText: {
        fontSize: 12,
        fontWeight: '600',
        color: colors.text,
    },

    // What others are reading
    activelyReadSection: {
        marginBottom: Spacing.four,
        gap: Spacing.two,
    },
    sectionLabel: {
        fontSize: 12,
        fontWeight: '600',
        color: colors.textSecondary,
        textTransform: 'uppercase',
        letterSpacing: 0.6,
    },
    activelyReadCard: {
        width: 88,
        marginRight: Spacing.three,
    },
    activelyReadCover: {
        width: 88,
        height: 120,
        borderRadius: BorderRadius.small,
    },
    activelyReadCoverPlaceholder: {
        width: 88,
        height: 120,
        borderRadius: BorderRadius.small,
        backgroundColor: colors.backgroundElement,
        alignItems: 'center',
        justifyContent: 'center',
    },
    activelyReadTitle: {
        fontSize: 12,
        color: colors.text,
        marginTop: 4,
    },
    popularCount: {
        fontSize: 11,
        color: colors.textSecondary,
        marginTop: 2,
    },

    // Status filter chips
    filterRow: {
        flexDirection: 'row',
        gap: 8,
        marginBottom: Spacing.three,
    },
    filterChip: {
        flex: 1,
        alignItems: 'center',
        backgroundColor: '#fff',
        borderRadius: 12,
        borderWidth: 0.5,
        borderColor: '#e0e0e0',
        paddingVertical: 10,
        paddingHorizontal: 6,
    },
    filterChipSelected: {
        backgroundColor: '#FFF3D6',
        borderWidth: 1.5,
        borderColor: '#f0b429',
    },
    filterText: {
        fontSize: 12,
        fontWeight: '600',
        color: '#555',
        textAlign: 'center',
    },
    filterTextSelected: {
        color: '#5a3a00',
    },
});
