import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { useTheme } from '@/hooks/use-theme';

interface CheckboxProps {
    label: string;
    checked: boolean;
    onPress: () => void;
    disabled?: boolean;
}

/** A labeled checkbox row — box on the left, tappable label beside it. */
export default function Checkbox({ label, checked, onPress, disabled }: CheckboxProps) {
    const colors = useTheme();
    const styles = createStyles(colors);

    return (
        <TouchableOpacity
            style={styles.row}
            onPress={onPress}
            disabled={disabled}
            activeOpacity={0.7}
            accessibilityRole="checkbox"
            accessibilityState={{ checked }}
        >
            <View style={[styles.box, checked && styles.boxChecked]} />
            <Text style={styles.label}>{label}</Text>
        </TouchableOpacity>
    );
}

const createStyles = (colors: ReturnType<typeof useTheme>) => StyleSheet.create({
    row: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
    },
    box: {
        width: 20,
        height: 20,
        borderRadius: 6,
        borderWidth: 1.5,
        borderColor: colors.accent,
    },
    boxChecked: {
        backgroundColor: colors.accent,
    },
    label: {
        fontSize: 14,
        color: colors.text,
    },
});
