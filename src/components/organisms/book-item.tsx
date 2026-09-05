import { Image, Pressable, StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { UserBookWithBook } from '@/api/books';
import { createCommonStyles } from '@/constants/common-styles';
import { BorderRadius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { readingProgress } from '@/lib/reading-progress';
import { router } from 'expo-router';

import Typography from '../atoms/typography';

/**
 * One book in the Library list. A flat row on the list's white panel — the
 * divider does the separating, so it carries no card background of its own.
 */
export default function BookItem({ userBook }: { userBook: UserBookWithBook }) {
    const colors = useTheme();
    const styles = useStyles(colors);
    const common = createCommonStyles();
    const { t } = useTranslation();

    const { book } = userBook;
    const progress = readingProgress(userBook);

    function navigateToBook() {
        router.navigate(`/books/${book.id}`);
    }

    return (
        <Pressable
            style={({ pressed }) => [styles.container, pressed && common.pressed]}
            onPress={navigateToBook}
        >
            {book.cover_url ? (
                <Image source={{ uri: book.cover_url }} style={styles.cover} resizeMode="cover" />
            ) : (
                <View style={[styles.cover, styles.coverEmpty]}>
                    <Typography color="sheetText" style={styles.coverEmoji}>📖</Typography>
                </View>
            )}
            <View style={styles.info}>
                <Typography variant="cardTitle" color="sheetText" numberOfLines={1}>{book.title}</Typography>
                {book.author && (
                    <Typography variant="caption" numberOfLines={1} color="sheetTextSecondary">{book.author}</Typography>
                )}
                {progress && (
                    <>
                        <Typography variant="caption" color="sheetTextSecondary" style={styles.progressLabel}>
                            {t('books.progressLabel', { percent: progress.percent, count: progress.pagesLeft })}
                        </Typography>
                        <View testID="book-item-progress" style={styles.progressTrack}>
                            <View style={[styles.progressFill, { width: `${progress.percent}%` }]} />
                        </View>
                    </>
                )}
            </View>
        </Pressable>
    )
}

const useStyles = (colors: ReturnType<typeof useTheme>) => StyleSheet.create({
    container: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: Spacing.three,
        borderBottomWidth: StyleSheet.hairlineWidth,
        // Fixed, like the panel it sits on — `border` flips and would go
        // invisible against white in dark mode.
        borderBottomColor: colors.progressTrack,
    },
    cover: {
        width: 48,
        height: 70,
        borderRadius: BorderRadius.small,
    },
    coverEmpty: {
        backgroundColor: colors.progressTrack,
        alignItems: 'center',
        justifyContent: 'center',
    },
    coverEmoji: {
        fontSize: 20,
    },
    info: {
        flex: 1,
        marginLeft: Spacing.three,
    },
    progressLabel: {
        marginTop: Spacing.two,
    },
    progressTrack: {
        height: 4,
        borderRadius: BorderRadius.small,
        backgroundColor: colors.progressTrack,
        marginTop: Spacing.one,
        overflow: 'hidden',
    },
    progressFill: {
        height: '100%',
        borderRadius: BorderRadius.small,
        backgroundColor: colors.accentStrong,
    },
});
