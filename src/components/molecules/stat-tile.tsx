import { StyleSheet, View } from 'react-native';

import Typography from '@/components/atoms/typography';
import { BorderRadius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

export interface StatTileProps {
    label: string;
    /** Pre-formatted by the caller, through i18n. */
    value: string;
    caption?: string;
}

/** One number with its label. The building block of the stats grid. */
export default function StatTile({ label, value, caption }: StatTileProps) {
    const colors = useTheme();
    const styles = createStyles(colors);

    return (
        <View style={styles.tile}>
            <Typography variant="sectionLabel" color="textSecondary">{label}</Typography>
            <Typography variant="title2">{value}</Typography>
            {caption && (
                <Typography variant="caption" color="textSecondary">{caption}</Typography>
            )}
        </View>
    );
}

const createStyles = (colors: ReturnType<typeof useTheme>) => StyleSheet.create({
    tile: {
        flexGrow: 1,
        // Two across at any width, without hard-coding a column count.
        flexBasis: '45%',
        gap: Spacing.one,
        padding: Spacing.three,
        borderRadius: BorderRadius.large,
        backgroundColor: colors.backgroundElement,
    },
});
