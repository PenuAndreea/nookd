import { ReactNode } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

interface EmptyStateProps {
    title: string;
    subtitle?: string;
    /** Artwork above the text. Omit for a plain, compact empty state. */
    illustration?: ReactNode;
    /** A call to action below the text, usually a Button. */
    action?: ReactNode;
}

/** The "there is nothing here" state for a list. */
export const EmptyState = ({ title, subtitle, illustration, action }: EmptyStateProps) => {
    const colors = useTheme();
    const styles = createStyles(colors);

    return (
        <View style={[styles.wrapper, !illustration && styles.compact]}>
            {illustration}
            <Text style={styles.title}>{title}</Text>
            {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
            {action && <View style={styles.action}>{action}</View>}
        </View>
    );
};

const createStyles = (colors: ReturnType<typeof useTheme>) => StyleSheet.create({
    wrapper: {
        alignItems: 'center',
        marginTop: Spacing.six,
        gap: Spacing.two,
    },
    compact: {
        marginTop: Spacing.five,
    },
    title: {
        fontSize: 15,
        fontWeight: '600',
        color: colors.textSecondary,
        textAlign: 'center',
    },
    subtitle: {
        fontSize: 14,
        color: colors.textSecondary,
        textAlign: 'center',
    },
    action: {
        marginTop: Spacing.two,
    },
});
