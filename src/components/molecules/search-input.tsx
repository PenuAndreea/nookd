import { useState } from 'react';
import {
    FlatList,
    Image,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';

import { searchOpenLibrary } from '@/api/books';
import { useTheme } from '@/hooks/use-theme';
import { SearchField } from './search-field';

export interface Book {
    openLibraryKey: string;
    title: string;
    author: string;
    thumbnail?: string;
    pageCount?: number;
}

interface BookSearchProps {
    value: Book | null;
    onChange: (book: Book | null) => void;
}

export const BookSearch = ({ value, onChange }: BookSearchProps) => {
    const colors = useTheme();
    const styles = createStyles(colors);

    const [query, setQuery] = useState('');
    const [results, setResults] = useState<Book[]>([]);
    const [loading, setLoading] = useState(false);

    const search = async (text: string) => {
        setQuery(text);
        if (text.length < 3) {
            setResults([]);
            return;
        }

        setLoading(true);
        try {
            const found = await searchOpenLibrary(text);
            setResults(
                found.map((item) => ({
                    openLibraryKey: item.openLibraryKey,
                    title: item.title,
                    author: item.author,
                    thumbnail: item.coverUrl,
                    pageCount: item.pageCount,
                }))
            );
        } catch {
            setResults([]);
        } finally {
            setLoading(false);
        }
    };

    const select = (book: Book) => {
        onChange(book);
        setQuery('');
        setResults([]);
    };

    const clear = () => {
        onChange(null);
        setQuery('');
        setResults([]);
    };

    return (
        <View style={styles.wrapper}>
            <Text style={styles.label}>Book <Text style={styles.optional}>(optional)</Text></Text>

            {value ? (
                <View style={styles.selectedBook}>
                    {value.thumbnail && (
                        <Image source={{ uri: value.thumbnail }} style={styles.thumbnail} resizeMode="contain" />
                    )}
                    <View style={styles.selectedInfo}>
                        <Text style={styles.selectedTitle} numberOfLines={1}>{value.title}</Text>
                        <Text style={styles.selectedAuthor} numberOfLines={1}>{value.author}</Text>
                    </View>
                    <TouchableOpacity onPress={clear} style={styles.clearButton} hitSlop={8}>
                        <Text style={styles.clearText}>✕</Text>
                    </TouchableOpacity>
                </View>
            ) : (
                <SearchField
                    placeholder="Search by title or author"
                    value={query}
                    onChangeText={search}
                    loading={loading}
                />
            )}

            {results.length > 0 && (
                <View style={styles.dropdown}>
                    <FlatList
                        showsVerticalScrollIndicator
                        data={results}
                        keyExtractor={item => item.openLibraryKey}
                        scrollEnabled={false}
                        ItemSeparatorComponent={() => <View style={styles.separator} />}
                        renderItem={({ item }) => (
                            <TouchableOpacity
                                style={styles.result}
                                onPress={() => select(item)}
                                activeOpacity={0.7}
                            >
                                {item.thumbnail ? (
                                    <Image source={{ uri: item.thumbnail }} style={styles.resultThumbnail} resizeMode="contain" />
                                ) : (
                                    <View style={styles.resultThumbnailPlaceholder}>
                                        <Text style={{ fontSize: 18 }}>📖</Text>
                                    </View>
                                )}
                                <View style={styles.resultInfo}>
                                    <Text style={styles.resultTitle} numberOfLines={1}>{item.title}</Text>
                                    <Text style={styles.resultAuthor} numberOfLines={1}>{item.author}</Text>
                                </View>
                            </TouchableOpacity>
                        )}
                    />
                </View>
            )}
        </View>
    );
};

const createStyles = (colors: ReturnType<typeof useTheme>) => StyleSheet.create({
    wrapper: {
        gap: 6,
    },
    label: {
        fontSize: 12,
        fontWeight: '600',
        color: colors.textSecondary,
        textTransform: 'uppercase',
        letterSpacing: 0.6,
    },
    optional: {
        fontWeight: '400',
        textTransform: 'none',
        letterSpacing: 0,
        color: colors.textSecondary,
    },


    // Dropdown results
    dropdown: {
        backgroundColor: colors.white,
        borderRadius: 12,
        borderWidth: 0.5,
        borderColor: colors.border,
        overflow: 'hidden',
    },
    result: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 12,
        gap: 12,
    },
    resultThumbnail: {
        width: 36,
        height: 48,
        borderRadius: 4,
    },
    resultThumbnailPlaceholder: {
        width: 36,
        height: 48,
        borderRadius: 4,
        backgroundColor: colors.backgroundElement,
        alignItems: 'center',
        justifyContent: 'center',
    },
    resultInfo: {
        flex: 1,
    },
    resultTitle: {
        // The dropdown is always white — needs the fixed-dark token, not the
        // theme-flipping one, or it disappears in dark mode.
        fontSize: 14,
        fontWeight: '600',
        color: colors.sheetText,
    },
    resultAuthor: {
        fontSize: 13,
        color: colors.sheetTextSecondary,
        marginTop: 2,
    },
    separator: {
        height: 0.5,
        backgroundColor: colors.background,
        marginHorizontal: 12,
    },

    // Selected state
    selectedBook: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: colors.backgroundElement,
        borderRadius: 12,
        borderWidth: 1.5,
        borderColor: colors.accent,
        padding: 12,
        gap: 12,
    },
    thumbnail: {
        width: 36,
        height: 48,
        borderRadius: 4,
    },
    selectedInfo: {
        flex: 1,
    },
    selectedTitle: {
        fontSize: 14,
        fontWeight: '600',
        color: colors.text,
    },
    selectedAuthor: {
        fontSize: 13,
        color: colors.textSecondary,
        marginTop: 2,
    },
    clearButton: {
        padding: 4,
    },
    clearText: {
        fontSize: 14,
        color: colors.textSecondary,
    },
});
