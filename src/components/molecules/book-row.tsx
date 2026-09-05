import { ReactNode } from 'react';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';

import Typography from '@/components/atoms/typography';
import { createCommonStyles } from '@/constants/common-styles';
import { BorderRadius } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

const COVER_SIZES = {
    small: { width: 36, height: 48 },
    medium: { width: 56, height: 78 },
};

interface BookRowProps {
    book: { title: string; author?: string | null; cover_url?: string | null };
    /** Navigates (e.g. to the book's page) when pressed; renders as a plain row without one. */
    onPress?: () => void;
    /**
     * Force the white card treatment on a row that isn't pressable. The row's
     * text is fixed-dark `sheetText`, so a row placed straight onto the page
     * background needs this or it goes dark-on-dark in dark mode.
     */
    surface?: boolean;
    disabled?: boolean;
    /** small = a compact search-result row, medium = a fuller book card. */
    size?: 'small' | 'medium';
    /** Rendered to the right of the info column (e.g. a "+ Add" chip). */
    trailing?: ReactNode;
    /** Rendered under the title/author, inside the info column (e.g. a reader-count pill). */
    belowInfo?: ReactNode;
}

/**
 * A book's cover, title and author in a row — the shared shape behind the
 * Books search results and the "currently reading" cards in a room's sheet.
 */
export default function BookRow({ book, onPress, disabled, size = 'small', surface, trailing, belowInfo }: BookRowProps) {
    const colors = useTheme();
    const styles = createStyles(colors, size);
    const common = createCommonStyles();
    const cover = COVER_SIZES[size];

    const content = (
        <>
            {book.cover_url ? (
                <Image source={{ uri: book.cover_url }} style={[styles.cover, cover]} resizeMode="contain" />
            ) : (
                <View style={[styles.cover, styles.coverEmpty, cover]}>
                    <Text style={styles.coverEmoji}>📖</Text>
                </View>
            )}
            <View style={styles.info}>
                <Typography
                    variant={size === 'medium' ? 'cardTitle' : 'bodyBold'}
                    color="sheetText"
                    numberOfLines={size === 'medium' ? 2 : 1}
                >
                    {book.title}
                </Typography>
                {book.author && (
                    <Typography variant="caption" color="sheetTextSecondary" numberOfLines={1}>{book.author}</Typography>
                )}
                {belowInfo}
            </View>
            {trailing}
        </>
    );

    if (!onPress) {
        return <View style={[styles.row, surface && styles.card]}>{content}</View>;
    }

    return (
        <Pressable
            style={({ pressed }) => [styles.row, styles.card, pressed && common.pressed]}
            onPress={onPress}
            disabled={disabled}
        >
            {content}
        </Pressable>
    );
}

const createStyles = (colors: ReturnType<typeof useTheme>, size: 'small' | 'medium') => StyleSheet.create({
    row: {
        flexDirection: 'row',
        alignItems: size === 'small' ? 'center' : 'flex-start',
        gap: 12,
    },
    card: {
        backgroundColor: colors.white,
        borderRadius: BorderRadius.medium,
        borderWidth: 0.5,
        borderColor: colors.border,
        padding: 12,
    },
    cover: {
        borderRadius: size === 'small' ? 4 : 8,
    },
    coverEmpty: {
        backgroundColor: colors.backgroundElement,
        alignItems: 'center',
        justifyContent: 'center',
    },
    coverEmoji: {
        fontSize: size === 'small' ? 18 : 20,
    },
    info: {
        flex: 1,
        gap: 2,
    },
});
