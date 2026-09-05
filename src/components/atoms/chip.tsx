import { StyleProp, StyleSheet, Text, TouchableOpacity, ViewStyle } from 'react-native';

import { TypographyStyles } from './typography';
import { useTheme } from '@/hooks/use-theme';

interface ChipProps {
    label: string;
    emoji?: string;
    selected: boolean;
    onPress: () => void;
    disabled?: boolean;
    /**
     * Use the fixed palette, for a chip on a surface that is always literally
     * white regardless of theme. The default `chip*` tokens flip to a dark
     * fill in dark mode, which inverts against a surface that doesn't.
     */
    onWhite?: boolean;
    style?: StyleProp<ViewStyle>;
}

/** A single selectable pill — the shared look behind every picker/filter row in the app. */
export default function Chip({ label, emoji, selected, onPress, disabled, onWhite, style }: ChipProps) {
    const colors = useTheme();
    const styles = createStyles(colors, onWhite);

    return (
        <TouchableOpacity
            style={[styles.chip, selected && styles.chipSelected, style]}
            onPress={onPress}
            disabled={disabled}
            activeOpacity={0.7}
        >
            {emoji && <Text style={styles.emoji}>{emoji}</Text>}
            <Text style={[styles.text, selected && styles.textSelected]} numberOfLines={1}>
                {label}
            </Text>
        </TouchableOpacity>
    );
}

const createStyles = (colors: ReturnType<typeof useTheme>, onWhite?: boolean) => StyleSheet.create({
    chip: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        backgroundColor: onWhite ? colors.white : colors.chipBackground,
        borderRadius: 12,
        borderWidth: 0.5,
        borderColor: onWhite ? colors.progressTrack : colors.chipBorder,
        paddingHorizontal: 14,
        paddingVertical: 10,
    },
    chipSelected: {
        backgroundColor: onWhite ? colors.chipOnWhiteSelectedBackground : colors.chipSelectedBackground,
        borderWidth: 1.5,
        borderColor: onWhite ? colors.accent : colors.chipSelectedBorder,
    },
    emoji: {
        fontSize: 16,
    },
    text: {
        ...TypographyStyles.captionSemibold,
        color: onWhite ? colors.sheetText : colors.chipText,
        textAlign: 'center',
    },
    textSelected: {
        color: onWhite ? colors.chipOnWhiteSelectedText : colors.chipSelectedText,
    },
});
