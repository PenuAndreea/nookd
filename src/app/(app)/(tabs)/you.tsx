import BottomSheet from '@gorhom/bottom-sheet';
import { useRef } from 'react';
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
import PendingReflectionCard from '@/components/organisms/pending-reflection-card';
import ReflectionSheet, { type ReflectionData } from '@/components/organisms/reflection-sheet';
import StatsJournalCard from '@/components/organisms/stats-journal-card';
import StatsTimeCard from '@/components/organisms/stats-time-card';
import { BottomTabInset, Spacing } from '@/constants/theme';
import { useAuth } from '@/contexts/auth-context';
import { usePendingReflection } from '@/hooks/use-pending-reflection';
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

    const { summary, sessions, loading, error, range, setRange, reload } = useReadingStats(userId);
    const { pending, userBook, submit, dismiss } = usePendingReflection(userId);
    const reflectionSheetRef = useRef<BottomSheet>(null);

    async function handleReflectionSubmit(data: ReflectionData) {
        await submit(data);
        reflectionSheetRef.current?.close();
    }

    async function handleReflectionDismiss() {
        reflectionSheetRef.current?.close();
        await dismiss();
    }

    // `sessionCount` is already past the sub-minute floor, so a reader whose
    // only session was a two-second bounce correctly sees the empty state.
    const hasSessions = summary.sessionCount > 0;

    return (
        <View style={styles.screen}>
        <ScrollView contentContainerStyle={styles.content}>
            <View style={styles.header}>
                <Typography variant="title1">{t('you.title')}</Typography>
                {userId && <Avatar id={userId} size="large" />}
            </View>

            {/* Above the statistics: it is a question waiting on the reader,
                not another number to read. */}
            <PendingReflectionCard
                pending={pending}
                onOpen={() => reflectionSheetRef.current?.snapToIndex(0)}
                onDismiss={handleReflectionDismiss}
            />

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
                    <StatsJournalCard sessions={sessions} />
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

        {/* Outside the ScrollView on purpose: a bottom sheet nested in a
            scroll container is clipped to it rather than overlaying the
            screen. */}
        {pending && (
            <ReflectionSheet
                ref={reflectionSheetRef}
                book={pending.book}
                initialPage={userBook?.current_page}
                onSubmit={handleReflectionSubmit}
                onSkip={handleReflectionDismiss}
            />
        )}
        </View>
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
