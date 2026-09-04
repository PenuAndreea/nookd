import { ReactNode, useState } from 'react';
import { StyleSheet, Text, TextInput, TextInputProps, View } from 'react-native';

import { useTheme } from '@/hooks/use-theme';

interface LabeledInputProps extends TextInputProps {
    label: string;
    error?: string;
    /** Rendered beside the input (e.g. a "Save" button) instead of below it. */
    right?: ReactNode;
}

export const LabeledInput = ({ label, error, right, ...props }: LabeledInputProps) => {
    const colors = useTheme();
    const styles = createStyles(colors);
    const [focused, setFocused] = useState(false);

    const input = (
        <TextInput
            style={[
                styles.input,
                !!right && styles.inputWithRight,
                focused && styles.inputFocused,
                error && styles.inputError,
            ]}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
            placeholderTextColor={colors.sheetTextSecondary}
            {...props}
        />
    );

    return (
        <View style={styles.wrapper}>
            <Text style={styles.label}>{label}</Text>
            {right ? (
                <View style={styles.row}>
                    {input}
                    {right}
                </View>
            ) : input}
            {error && <Text style={styles.error}>{error}</Text>}
        </View>
    );
};

const createStyles = (colors: ReturnType<typeof useTheme>) => StyleSheet.create({
    wrapper: {
        gap: 6,
    },
    label: {
        fontSize: 12,
        fontWeight: '600',
        color: colors.textSecondary,
        textTransform: 'uppercase',
        letterSpacing: 0.6,
    },
    row: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    input: {
        backgroundColor: colors.white,
        borderRadius: 12,
        borderWidth: 0.5,
        borderColor: colors.border,
        paddingHorizontal: 14,
        paddingVertical: 13,
        fontSize: 15,
        // The box is always white — typed text needs the fixed-dark token,
        // or it turns near-white (and invisible) in dark mode.
        color: colors.sheetText,
    },
    inputWithRight: {
        flex: 1,
    },
    inputFocused: {
        borderWidth: 1.5,
        borderColor: colors.accent,
    },
    inputError: {
        borderWidth: 1.5,
        borderColor: colors.error,
    },
    error: {
        fontSize: 12,
        color: colors.error,
    },
});
