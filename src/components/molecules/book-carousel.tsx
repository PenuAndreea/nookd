import { Image, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { BorderRadius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

export interface BookCarouselItem {
    key: string;
    book: { id: string; title: string; cover_url: string | null };
    /** Small line under the title (e.g. "3 rooms"). */
    subtitle?: string;
}

interface BookCarouselProps {
    title: string;
    items: BookCarouselItem[];
    onPressItem: (bookId: string) => void;
}

/** A labeled horizontal shelf of book covers — "What others are reading", "Popular books". */
export default function BookCarousel({ title, items, onPressItem }: BookCarouselProps) {
    const colors = useTheme();
    const styles = createStyles(colors);

    if (items.length === 0) return null;

    return (
        <View style={styles.section}>
            <Text style={styles.label}>{title}</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                {items.map(({ key, book, subtitle }) => (
                    <TouchableOpacity
                        key={key}
                        style={styles.card}
                        onPress={() => onPressItem(book.id)}
                        activeOpacity={0.7}
                    >
                        {book.cover_url ? (
                            <Image source={{ uri: book.cover_url }} style={styles.cover} resizeMode="contain" />
                        ) : (
                            <View style={[styles.cover, styles.coverEmpty]}>
                                <Text style={{ fontSize: 20 }}>📖</Text>
                            </View>
                        )}
                        <Text style={styles.title} numberOfLines={2}>{book.title}</Text>
                        {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
                    </TouchableOpacity>
                ))}
            </ScrollView>
        </View>
    );
}

const createStyles = (colors: ReturnType<typeof useTheme>) => StyleSheet.create({
    section: {
        marginBottom: Spacing.four,
        gap: Spacing.two,
    },
    label: {
        fontSize: 12,
        fontWeight: '600',
        color: colors.textSecondary,
        textTransform: 'uppercase',
        letterSpacing: 0.6,
    },
    card: {
        width: 88,
        marginRight: Spacing.three,
    },
    cover: {
        width: 88,
        height: 120,
        borderRadius: BorderRadius.small,
    },
    coverEmpty: {
        backgroundColor: colors.backgroundElement,
        alignItems: 'center',
        justifyContent: 'center',
    },
    title: {
        fontSize: 12,
        color: colors.text,
        marginTop: 4,
    },
    subtitle: {
        fontSize: 11,
        color: colors.textSecondary,
        marginTop: 2,
    },
});
