import { useState } from 'react';
import {
    ActivityIndicator,
    FlatList,
    Image,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';

export interface Book {
    id: string;
    title: string;
    author: string;
    thumbnail?: string;
}

interface BookSearchProps {
    value: Book | null;
    onChange: (book: Book | null) => void;
}

export const BookSearch = ({ value, onChange }: BookSearchProps) => {
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
            const res = await fetch(
                `https://openlibrary.org/search.json?q=${encodeURIComponent(text)}&limit=5&fields=key,title,author_name,cover_i`
            );
            const data = await res.json();
            const books: Book[] = (data.docs ?? []).map((item: any) => ({
                id: item.key,
                title: item.title,
                author: item.author_name?.[0] ?? 'Unknown author',
                thumbnail: item.cover_i
                    ? `https://covers.openlibrary.org/b/id/${item.cover_i}-S.jpg`
                    : undefined,
            }));
            setResults(books);
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
                        <Image source={{ uri: value.thumbnail }} style={styles.thumbnail} />
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
                <View style={styles.inputWrapper}>
                    <Text style={styles.searchIcon}>🔍</Text>
                    <TextInput
                        style={styles.input}
                        placeholder="Search by title or author"
                        placeholderTextColor="#aaa"
                        value={query}
                        onChangeText={search}
                    />
                    {loading && <ActivityIndicator size="small" color="#f0b429" />}
                </View>
            )}

            {results.length > 0 && (
                <View style={styles.dropdown}>
                    <FlatList
                        data={results}
                        keyExtractor={item => item.id}
                        scrollEnabled={false}
                        ItemSeparatorComponent={() => <View style={styles.separator} />}
                        renderItem={({ item }) => (
                            <TouchableOpacity
                                style={styles.result}
                                onPress={() => select(item)}
                                activeOpacity={0.7}
                            >
                                {item.thumbnail ? (
                                    <Image source={{ uri: item.thumbnail }} style={styles.resultThumbnail} />
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

const styles = StyleSheet.create({
    wrapper: {
        gap: 6,
    },
    label: {
        fontSize: 12,
        fontWeight: '600',
        color: '#888',
        textTransform: 'uppercase',
        letterSpacing: 0.6,
    },
    optional: {
        fontWeight: '400',
        textTransform: 'none',
        letterSpacing: 0,
        color: '#bbb',
    },

    // Search input
    inputWrapper: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#fff',
        borderRadius: 12,
        borderWidth: 0.5,
        borderColor: '#e0e0e0',
        paddingHorizontal: 14,
        gap: 10,
    },
    searchIcon: {
        fontSize: 16,
    },
    input: {
        flex: 1,
        fontSize: 15,
        color: '#1a1a1a',
        paddingVertical: 13,
    },

    // Dropdown results
    dropdown: {
        backgroundColor: '#fff',
        borderRadius: 12,
        borderWidth: 0.5,
        borderColor: '#e0e0e0',
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
        backgroundColor: '#f5f4f0',
        alignItems: 'center',
        justifyContent: 'center',
    },
    resultInfo: {
        flex: 1,
    },
    resultTitle: {
        fontSize: 14,
        fontWeight: '600',
        color: '#1a1a1a',
    },
    resultAuthor: {
        fontSize: 13,
        color: '#888',
        marginTop: 2,
    },
    separator: {
        height: 0.5,
        backgroundColor: '#e0e0e0',
        marginHorizontal: 12,
    },

    // Selected state
    selectedBook: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FFF3D6',
        borderRadius: 12,
        borderWidth: 1.5,
        borderColor: '#f0b429',
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
        color: '#5a3a00',
    },
    selectedAuthor: {
        fontSize: 13,
        color: '#8a6000',
        marginTop: 2,
    },
    clearButton: {
        padding: 4,
    },
    clearText: {
        fontSize: 14,
        color: '#8a6000',
    },
});