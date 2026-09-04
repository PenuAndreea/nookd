import { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';

import Typography from '@/components/atoms/typography';
import { Spacing } from '@/constants/theme';

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
    return (
        <View style={[styles.wrapper, !illustration && styles.compact]}>
            {illustration}
            <Typography variant="subhead" color="textSecondary" style={styles.centerText}>{title}</Typography>
            {subtitle && <Typography color="textSecondary" style={styles.centerText}>{subtitle}</Typography>}
            {action && <View style={styles.action}>{action}</View>}
        </View>
    );
};

const styles = StyleSheet.create({
    wrapper: {
        alignItems: 'center',
        marginTop: Spacing.six,
        gap: Spacing.two,
    },
    compact: {
        marginTop: Spacing.five,
    },
    centerText: {
        textAlign: 'center',
    },
    action: {
        marginTop: Spacing.two,
    },
});
