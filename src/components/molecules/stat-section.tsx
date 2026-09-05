import { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';

import Typography from '@/components/atoms/typography';
import { Spacing } from '@/constants/theme';

interface StatSectionProps {
    title: string;
    subtitle?: string;
    /** Rendered opposite the title — a range picker, a count. */
    right?: ReactNode;
    children: ReactNode;
}

/**
 * Heading and spacing for one section of the You tab, so the screen file stays
 * a composer rather than growing its own layout primitives.
 */
export default function StatSection({ title, subtitle, right, children }: StatSectionProps) {
    const styles = useStyles();

    return (
        <View style={styles.section}>
            <View style={styles.header}>
                <View style={styles.heading}>
                    <Typography variant="title3">{title}</Typography>
                    {subtitle && (
                        <Typography variant="caption" color="textSecondary">{subtitle}</Typography>
                    )}
                </View>
                {right}
            </View>
            {children}
        </View>
    );
}

const useStyles = () => StyleSheet.create({
    section: { gap: Spacing.three },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: Spacing.three,
    },
    heading: { flexShrink: 1, gap: Spacing.half },
});
