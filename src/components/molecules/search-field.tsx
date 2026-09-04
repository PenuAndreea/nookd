import { ActivityIndicator, StyleSheet, Text, TextInput, TextInputProps, View } from 'react-native';

import { TypographyStyles } from '@/components/atoms/typography';
import { useTheme } from '@/hooks/use-theme';

interface SearchFieldProps extends TextInputProps {
    /** Shows a spinner inside the field while a query is in flight. */
    loading?: boolean;
}

/** The search field chrome — icon, input and spinner in a bordered row. */
export const SearchField = ({ loading, ...props }: SearchFieldProps) => {
    const colors = useTheme();
    const styles = createStyles(colors);

    return (
        <View style={styles.wrapper}>
            <Text style={styles.icon}>🔍</Text>
            <TextInput
                style={styles.input}
                placeholderTextColor={colors.sheetTextSecondary}
                {...props}
            />
            {loading && <ActivityIndicator testID="search-field-loading" size="small" color={colors.accent} />}
        </View>
    );
};

const createStyles = (colors: ReturnType<typeof useTheme>) => StyleSheet.create({
    wrapper: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: colors.white,
        borderRadius: 12,
        borderWidth: 0.5,
        borderColor: colors.border,
        paddingHorizontal: 14,
        gap: 10,
    },
    icon: {
        fontSize: 16,
    },
    input: {
        ...TypographyStyles.subtitle,
        flex: 1,
        // The wrapper is always white — needs the fixed-dark token, not the
        // theme-flipping one, or typed text vanishes in dark mode.
        color: colors.sheetText,
        paddingVertical: 13,
    },
});
