import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, ScrollView, StyleSheet, View } from 'react-native';

import Typography from '@/components/atoms/typography';
import BookCarousel from '@/components/molecules/book-carousel';
import { EmptyState } from '@/components/molecules/empty-state';
import { BottomTabInset, Spacing } from '@/constants/theme';
import { useExplore } from '@/hooks/use-explore';
import { useTheme } from '@/hooks/use-theme';

export { default as ErrorBoundary } from '@/components/organisms/route-error-boundary';

export default function ExploreScreen() {
    const colors = useTheme();
    const styles = createStyles(colors);
    const { t } = useTranslation();

    const { activelyReadItems, popularBookItems, loading } = useExplore();

    const isEmpty = activelyReadItems.length === 0 && popularBookItems.length === 0;

    return (
        <View style={styles.container}>
            <Typography variant="title1">{t('explore.title')}</Typography>

            {loading ? (
                <ActivityIndicator testID="explore-loading" size="large" color={colors.accent} style={styles.loading} />
            ) : isEmpty ? (
                <EmptyState title={t('explore.emptyTitle')} subtitle={t('explore.emptySubtitle')} />
            ) : (
                <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
                    <BookCarousel
                        title={t('explore.othersReading')}
                        subtitle={t('explore.othersReadingSubtitle')}
                        items={activelyReadItems}
                        // Keyed by room, so this goes to the room itself — the
                        // point of the shelf is to go and read with them.
                        onPressItem={(item) => router.push({ pathname: '/room/[id]', params: { id: item.key } })}
                    />
                    <BookCarousel
                        title={t('explore.popularBooks')}
                        items={popularBookItems}
                        onPressItem={(item) => router.navigate(`/books/${item.book.id}`)}
                    />
                </ScrollView>
            )}
        </View>
    );
}

const createStyles = (colors: ReturnType<typeof useTheme>) => StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.background,
        paddingTop: Spacing.six,
        paddingHorizontal: Spacing.three,
        gap: Spacing.three,
    },
    content: {
        paddingBottom: BottomTabInset + Spacing.four,
    },
    loading: {
        marginTop: Spacing.six,
    },
});
