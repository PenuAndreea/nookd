import { StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { Icon } from '@/components/atoms/icon';
import Button from '@/components/atoms/button';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

interface ErrorStateProps {
    title?: string;
    subtitle?: string;
    /** Defaults to `common.tryAgain`. */
    retryLabel?: string;
    onRetry?: () => void;
}

/**
 * The "something went wrong" counterpart to EmptyState — for a fetch or
 * mutation that failed rather than legitimately returned nothing. Always
 * paired with a retry action so the user has a way forward that isn't
 * force-quitting the app.
 */
export const ErrorState = ({ title, subtitle, retryLabel, onRetry }: ErrorStateProps) => {
    const colors = useTheme();
    const styles = createStyles(colors);
    const { t } = useTranslation();

    return (
        <View style={styles.wrapper}>
            <Icon name="exclamationmark.triangle" size={32} color={colors.error} />
            <Text style={styles.title}>{title ?? t('common.errorTitle')}</Text>
            <Text style={styles.subtitle}>{subtitle ?? t('common.errorSubtitle')}</Text>
            {onRetry && (
                <View style={styles.action}>
                    <Button title={retryLabel ?? t('common.tryAgain')} onPress={onRetry} />
                </View>
            )}
        </View>
    );
};

const createStyles = (colors: ReturnType<typeof useTheme>) => StyleSheet.create({
    wrapper: {
        alignItems: 'center',
        marginTop: Spacing.six,
        gap: Spacing.two,
        paddingHorizontal: Spacing.four,
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
