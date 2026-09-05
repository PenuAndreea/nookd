import { Image, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import Typography from '@/components/atoms/typography';
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
    /** Optional line under the section label. */
    subtitle?: string;
    items: BookCarouselItem[];
    /** Given the whole item, since `key` and `book.id` differ for room-keyed shelves. */
    onPressItem: (item: BookCarouselItem) => void;
}

/** A labeled horizontal shelf of book covers — "What others are reading", "Popular books". */
export default function BookCarousel({ title, subtitle, items, onPressItem }: BookCarouselProps) {
    const colors = useTheme();
    const styles = createStyles(colors);

    if (items.length === 0) return null;

    return (
        <View style={styles.section}>
            <Typography variant="sectionLabel" color="textSecondary">{title}</Typography>
            {subtitle && <Typography variant="caption" color="textSecondary">{subtitle}</Typography>}
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                {items.map((item) => (
                    <TouchableOpacity
                        key={item.key}
                        style={styles.card}
                        onPress={() => onPressItem(item)}
                        activeOpacity={0.7}
                    >
                        {item.book.cover_url ? (
                            <Image source={{ uri: item.book.cover_url }} style={styles.cover} resizeMode="contain" />
                        ) : (
                            <View style={[styles.cover, styles.coverEmpty]}>
                                <Text style={{ fontSize: 20 }}>📖</Text>
                            </View>
                        )}
                        <Typography variant="small" style={styles.title} numberOfLines={2}>{item.book.title}</Typography>
                        {item.subtitle && <Typography variant="tiny" color="textSecondary" style={styles.subtitle}>{item.subtitle}</Typography>}
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
        marginTop: 4,
    },
    subtitle: {
        marginTop: 2,
    },
});
