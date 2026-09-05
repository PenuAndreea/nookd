import { useTranslation } from 'react-i18next';
import { Dimensions, FlatList, Image, StyleSheet, View } from 'react-native';

import { Book, UserBookWithBook } from '@/api/books';
import Button from '@/components/atoms/button';
import Typography from '@/components/atoms/typography';
import { BorderRadius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { readingProgress } from '@/lib/reading-progress';

// A card spans the screen minus the gutter, minus a sliver of the next one so
// it reads as a carousel rather than a single stacked card.
const PEEK = 48;
const CARD_WIDTH = Dimensions.get('window').width - Spacing.three * 2 - PEEK;

interface ContinueReadingCarouselProps {
    books: UserBookWithBook[];
    onContinue: (book: Book) => void;
}

/**
 * The Library header's shelf of books the reader is part-way through: cover,
 * progress and a way straight back into a silent room for that book. Sits on
 * the navy header, so every colour here is from the fixed `ink*` family.
 */
export default function ContinueReadingCarousel({ books, onContinue }: ContinueReadingCarouselProps) {
    const colors = useTheme();
    const styles = createStyles(colors);
    const { t } = useTranslation();

    if (books.length === 0) return null;

    return (
        <FlatList
            horizontal
            data={books}
            keyExtractor={(item) => item.id}
            showsHorizontalScrollIndicator={false}
            snapToInterval={CARD_WIDTH + Spacing.three}
            decelerationRate="fast"
            contentContainerStyle={styles.content}
            renderItem={({ item }) => {
                const progress = readingProgress(item);

                return (
                    <View style={styles.card}>
                        {item.book.cover_url ? (
                            <Image source={{ uri: item.book.cover_url }} style={styles.cover} resizeMode="cover" />
                        ) : (
                            <View style={[styles.cover, styles.coverEmpty]}>
                                <Typography style={styles.coverEmoji}>📖</Typography>
                            </View>
                        )}

                        <View style={styles.info}>
                            <Typography variant="title3" color="inkText" numberOfLines={2}>
                                {item.book.title}
                            </Typography>
                            {item.book.author && (
                                <Typography variant="subtitle" color="inkTextSecondary" numberOfLines={1}>
                                    {item.book.author}
                                </Typography>
                            )}

                            {progress && (
                                <View style={styles.progress}>
                                    <Typography variant="caption" color="inkText">
                                        {t('books.progressLabel', {
                                            percent: progress.percent,
                                            count: progress.pagesLeft,
                                        })}
                                    </Typography>
                                    <View style={styles.track}>
                                        <View style={[styles.fill, { width: `${progress.percent}%` }]} />
                                    </View>
                                </View>
                            )}

                            <Button
                                fullWidth
                                size="medium"
                                title={t('books.continueReading')}
                                accessibilityLabel={t('books.continueReadingAccessibility', { title: item.book.title })}
                                onPress={() => onContinue(item.book)}
                            />
                        </View>
                    </View>
                );
            }}
        />
    );
}

const createStyles = (colors: ReturnType<typeof useTheme>) => StyleSheet.create({
    content: {
        paddingHorizontal: Spacing.three,
        gap: Spacing.three,
    },
    card: {
        width: CARD_WIDTH,
        flexDirection: 'row',
        gap: Spacing.three,
    },
    cover: {
        width: 108,
        height: 160,
        borderRadius: BorderRadius.medium,
    },
    coverEmpty: {
        backgroundColor: colors.progressTrackOnInk,
        alignItems: 'center',
        justifyContent: 'center',
    },
    coverEmoji: {
        fontSize: 28,
    },
    info: {
        flex: 1,
        justifyContent: 'center',
        gap: Spacing.one,
    },
    progress: {
        gap: Spacing.two,
        marginTop: Spacing.one,
        marginBottom: Spacing.two,
    },
    track: {
        height: 4,
        borderRadius: BorderRadius.small,
        backgroundColor: colors.progressTrackOnInk,
        overflow: 'hidden',
    },
    fill: {
        height: '100%',
        borderRadius: BorderRadius.small,
        backgroundColor: colors.accentStrong,
    },
});
