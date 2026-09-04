import { Image, StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import Typography from '@/components/atoms/typography';
import { BorderRadius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

interface BookHeroProps {
    book: { title: string; author?: string | null; cover_url?: string | null };
    /** How many rooms are actively reading this book right now. */
    activeRoomCount: number;
}

/** The book detail screen's header: a large cover beside the title, author and activity. */
export default function BookHero({ book, activeRoomCount }: BookHeroProps) {
    const colors = useTheme();
    const styles = createStyles(colors);
    const { t } = useTranslation();

    return (
        <View style={styles.row}>
            <View style={[styles.cover, book.cover_url && styles.coverNoBackground]}>
                {book.cover_url ? (
                    <Image source={{ uri: book.cover_url }} style={styles.coverImage} resizeMode="contain" />
                ) : (
                    <Text style={styles.coverEmoji}>📖</Text>
                )}
            </View>
            <View style={styles.info}>
                <Typography variant="title3">{book.title}</Typography>
                {book.author && <Typography color="textSecondary">{book.author}</Typography>}
                {activeRoomCount > 0 && (
                    <Typography variant="small" color="accent" style={styles.activeReaders}>
                        {t('books.activeReaders', { count: activeRoomCount })}
                    </Typography>
                )}
            </View>
        </View>
    );
}

const createStyles = (colors: ReturnType<typeof useTheme>) => StyleSheet.create({
    row: {
        flexDirection: 'row',
        gap: Spacing.three,
    },
    cover: {
        width: 96,
        height: 130,
        borderRadius: BorderRadius.medium,
        backgroundColor: colors.backgroundElement,
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
    },
    coverNoBackground: {
        backgroundColor: 'transparent',
    },
    coverImage: {
        width: '100%',
        height: '100%',
    },
    coverEmoji: {
        fontSize: 28,
    },
    info: {
        flex: 1,
        justifyContent: 'center',
        gap: 4,
    },
    activeReaders: {
        marginTop: 4,
    },
});
