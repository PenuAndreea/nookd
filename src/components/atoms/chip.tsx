import { StyleProp, StyleSheet, Text, TouchableOpacity, ViewStyle } from 'react-native';

import { TypographyStyles } from './typography';
import { useTheme } from '@/hooks/use-theme';

interface ChipProps {
    label: string;
    emoji?: string;
    selected: boolean;
    onPress: () => void;
    disabled?: boolean;
    style?: StyleProp<ViewStyle>;
}

/** A single selectable pill — the shared look behind every picker/filter row in the app. */
export default function Chip({ label, emoji, selected, onPress, disabled, style }: ChipProps) {
    const colors = useTheme();
    const styles = createStyles(colors);

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

const createStyles = (colors: ReturnType<typeof useTheme>) => StyleSheet.create({
    chip: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        backgroundColor: colors.chipBackground,
        borderRadius: 12,
        borderWidth: 0.5,
        borderColor: colors.chipBorder,
        paddingHorizontal: 14,
        paddingVertical: 10,
    },
    chipSelected: {
        backgroundColor: colors.chipSelectedBackground,
        borderWidth: 1.5,
        borderColor: colors.chipSelectedBorder,
    },
    emoji: {
        fontSize: 16,
    },
    text: {
        ...TypographyStyles.captionSemibold,
        color: colors.chipText,
        textAlign: 'center',
    },
    textSelected: {
        color: colors.chipSelectedText,
    },
});
