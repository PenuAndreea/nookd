import { useTranslation } from 'react-i18next';
import { ActivityIndicator, ScrollView, StyleSheet, View } from 'react-native';

import Avatar from '@/components/atoms/avatar';
import Button from '@/components/atoms/button';
import Typography from '@/components/atoms/typography';
import { EmptyState } from '@/components/molecules/empty-state';
import { ErrorState } from '@/components/molecules/error-state';
import { StatsRangeChips } from '@/components/molecules/stats-range-chips';
import StatsBooksCard from '@/components/organisms/stats-books-card';
import StatsHabitsCard from '@/components/organisms/stats-habits-card';
import StatsTimeCard from '@/components/organisms/stats-time-card';
import { BottomTabInset, Spacing } from '@/constants/theme';
import { useAuth } from '@/contexts/auth-context';
import { useReadingStats } from '@/hooks/use-reading-stats';
import { useTheme } from '@/hooks/use-theme';

export { default as ErrorBoundary } from '@/components/organisms/route-error-boundary';

export default function YouScreen() {
    const { session, signOut } = useAuth();
    const colors = useTheme();
    const styles = createStyles(colors);
    const { t } = useTranslation();

    const userId = session?.user.id;
    const email = session?.user.email;

    const { summary, loading, error, range, setRange, reload } = useReadingStats(userId);

    // `sessionCount` is already past the sub-minute floor, so a reader whose
    // only session was a two-second bounce correctly sees the empty state.
    const hasSessions = summary.sessionCount > 0;

    return (
        <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
            <View style={styles.header}>
                <Typography variant="title1">{t('you.title')}</Typography>
                {userId && <Avatar id={userId} size="large" />}
            </View>

            <StatsRangeChips value={range} onChange={setRange} />

            {loading && !hasSessions ? (
                <ActivityIndicator testID="you-loading" color={colors.accent} />
            ) : error && !hasSessions ? (
                <ErrorState
                    title={t('you.loadErrorTitle')}
                    subtitle={t('you.loadErrorSubtitle')}
                    onRetry={reload}
                />
            ) : hasSessions ? (
                <>
                    <StatsTimeCard summary={summary} range={range} />
                    <StatsBooksCard summary={summary} />
                    <StatsHabitsCard summary={summary} />
                </>
            ) : (
                <EmptyState title={t('you.emptyTitle')} subtitle={t('you.emptySubtitle')} />
            )}

            <View style={styles.account}>
                {email && (
                    <Typography variant="caption" color="textSecondary" numberOfLines={1}>
                        {email}
                    </Typography>
                )}
                <Button
                    title={t('profile.signOut')}
                    icon="rectangle.portrait.and.arrow.right"
                    onPress={signOut}
                />
            </View>
        </ScrollView>
    );
}

const createStyles = (colors: ReturnType<typeof useTheme>) => StyleSheet.create({
    screen: {
        flex: 1,
        backgroundColor: colors.background,
    },
    content: {
        paddingTop: Spacing.six,
        paddingHorizontal: Spacing.three,
        // The tab bar paints over the lower edge — keep sign-out clear of it.
        paddingBottom: BottomTabInset + Spacing.four,
        gap: Spacing.four,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    account: {
        alignItems: 'center',
        gap: Spacing.two,
        marginTop: Spacing.two,
    },
});
