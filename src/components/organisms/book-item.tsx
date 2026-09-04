import { Image, Pressable, StyleSheet, View } from 'react-native';

import { UserBookWithBook } from '@/api/books';
import { createCommonStyles } from '@/constants/common-styles';
import { BorderRadius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { router } from 'expo-router';

import Typography from '../atoms/typography';

export default function BookItem({ userBook }: { userBook: UserBookWithBook }) {
    const colors = useTheme();
    const styles = useStyles(colors);
    const common = createCommonStyles();

    const { book } = userBook;
    const hasProgress =
        userBook.status === 'currently_reading' &&
        userBook.current_page != null &&
        !!book.page_count;
    const progress = hasProgress
        ? Math.min(userBook.current_page! / book.page_count!, 1)
        : 0;

    function navigateToBook() {
        router.navigate(`/books/${book.id}`);
    }

    return (
        <Pressable
            style={({ pressed }) => [styles.container, pressed && common.pressed]}
            onPress={navigateToBook}
        >
            <View style={[styles.cover, book.cover_url && styles.coverNoBackground]}>
                {book.cover_url ? (
                    <Image source={{ uri: book.cover_url }} style={styles.coverImage} resizeMode="contain" />
                ) : (
                    <Typography color="sheetText" style={{ fontSize: 24 }}>📖</Typography>
                )}
            </View>
            <View style={styles.info}>
                <Typography variant="h2" color="sheetText" numberOfLines={1}>{book.title}</Typography>
                {book.author && (
                    <Typography numberOfLines={1} color="sheetTextSecondary">{book.author}</Typography>
                )}
                {hasProgress && (
                    <View style={styles.progressTrack}>
                        <View style={[styles.progressFill, { width: `${Math.round(progress * 100)}%` }]} />
                    </View>
                )}
            </View>
        </Pressable>
    )
}

const useStyles = (colors: ReturnType<typeof useTheme>) => StyleSheet.create({
    container: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: Spacing.three,
        marginBottom: Spacing.two,
        backgroundColor: colors.white,
        borderWidth: 1,
        borderRadius: BorderRadius.medium,
        borderColor: colors.border,
    },
    cover: {
        width: 56,
        height: 76,
        borderRadius: BorderRadius.small,
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
    info: {
        flex: 1,
        marginLeft: Spacing.three,
    },
    progressTrack: {
        height: 4,
        borderRadius: 2,
        backgroundColor: colors.backgroundElement,
        marginTop: 6,
        overflow: 'hidden',
    },
    progressFill: {
        height: '100%',
        borderRadius: 2,
        backgroundColor: colors.accent,
    },
});
