import { StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { Icon } from '@/components/atoms/icon';
import Button from '@/components/atoms/button';
import Typography from '@/components/atoms/typography';
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
    const { t } = useTranslation();

    return (
        <View style={styles.wrapper}>
            <Icon name="exclamationmark.triangle" size={32} color={colors.error} />
            <Typography variant="subhead" color="textSecondary" style={styles.centerText}>
                {title ?? t('common.errorTitle')}
            </Typography>
            <Typography color="textSecondary" style={styles.centerText}>
                {subtitle ?? t('common.errorSubtitle')}
            </Typography>
            {onRetry && (
                <View style={styles.action}>
                    <Button title={retryLabel ?? t('common.tryAgain')} onPress={onRetry} />
                </View>
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    wrapper: {
        alignItems: 'center',
        marginTop: Spacing.six,
        gap: Spacing.two,
        paddingHorizontal: Spacing.four,
    },
    centerText: {
        textAlign: 'center',
    },
    action: {
        marginTop: Spacing.two,
    },
});
