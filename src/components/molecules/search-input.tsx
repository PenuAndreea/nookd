import { useState } from 'react';
import {
    FlatList,
    Image,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { useTranslation } from 'react-i18next';

import { searchOpenLibrary } from '@/api/books';
import Typography from '@/components/atoms/typography';
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
    const { t } = useTranslation();

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
            <Typography variant="sectionLabel" color="textSecondary">
                {t('common.book')} <Text style={styles.optional}>({t('common.optional')})</Text>
            </Typography>

            {value ? (
                <View style={styles.selectedBook}>
                    {value.thumbnail && (
                        <Image source={{ uri: value.thumbnail }} style={styles.thumbnail} resizeMode="contain" />
                    )}
                    <View style={styles.selectedInfo}>
                        <Typography variant="bodyBold" numberOfLines={1}>{value.title}</Typography>
                        <Typography variant="caption" color="textSecondary" style={styles.selectedAuthor} numberOfLines={1}>{value.author}</Typography>
                    </View>
                    <TouchableOpacity onPress={clear} style={styles.clearButton} hitSlop={8}>
                        <Typography color="textSecondary">✕</Typography>
                    </TouchableOpacity>
                </View>
            ) : (
                <SearchField
                    placeholder={t('books.searchPlaceholder')}
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
                                    <Typography variant="bodyBold" color="sheetText" numberOfLines={1}>{item.title}</Typography>
                                    <Typography variant="caption" color="sheetTextSecondary" style={styles.resultAuthor} numberOfLines={1}>{item.author}</Typography>
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
    resultAuthor: {
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
    selectedAuthor: {
        marginTop: 2,
    },
    clearButton: {
        padding: 4,
    },
});
