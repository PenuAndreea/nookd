import { StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import ProgressBar from '@/components/atoms/progress-bar';
import Typography from '@/components/atoms/typography';
import BarChart, { type BarDatum } from '@/components/molecules/bar-chart';
import StatSection from '@/components/molecules/stat-section';
import StatTile from '@/components/molecules/stat-tile';
import { Spacing } from '@/constants/theme';
import type { ReadingSummary } from '@/lib/stats';
import { formatPercent } from '@/lib/stats-format';

interface StatsHabitsCardProps {
    summary: ReadingSummary;
}

/** minutesByWeekday is Monday-first, so these line up index for index. */
const WEEKDAY_KEYS = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'] as const;

export default function StatsHabitsCard({ summary }: StatsHabitsCardProps) {
    const styles = useStyles();
    const { t } = useTranslation();

    const bars: BarDatum[] = summary.byWeekday.map((bucket) => ({
        key: String(bucket.weekday),
        label: t(`you.habits.weekdays.${WEEKDAY_KEYS[bucket.weekday]}`),
        value: bucket.minutes,
    }));

    return (
        <StatSection title={t('you.habits.sectionTitle')}>
            <View style={styles.tiles}>
                <StatTile
                    label={t('you.habits.currentStreakLabel')}
                    value={t('you.habits.streakDays', { count: summary.currentStreak })}
                />
                <StatTile
                    label={t('you.habits.longestStreakLabel')}
                    value={t('you.habits.streakDays', { count: summary.longestStreak })}
                />
                <StatTile
                    label={t('you.habits.daysReadLabel')}
                    value={String(summary.daysRead)}
                />
                <StatTile
                    label={t('you.habits.reflectionRateLabel')}
                    value={formatPercent(summary.reflectionRate, t)}
                />
            </View>

            <BarChart
                data={bars}
                height={90}
                accessibilityLabel={t('you.habits.byWeekdayChartLabel')}
                testID="stats-weekday-chart"
            />

            <Typography variant="sectionLabel" color="textSecondary">
                {t('you.habits.moodTitle')}
            </Typography>
            {summary.moods.length === 0 ? (
                <Typography variant="caption" color="textSecondary">
                    {t('you.habits.moodEmpty')}
                </Typography>
            ) : (
                <View style={styles.moods}>
                    {summary.moods.map((mood) => (
                        <View key={mood.mood} style={styles.mood}>
                            <View style={styles.moodHeader}>
                                <Typography variant="caption">
                                    {t(`rooms.sessionMoods.${mood.mood}`)}
                                </Typography>
                                <Typography variant="caption" color="textSecondary">
                                    {t('you.habits.moodShare', { percent: Math.round(mood.share * 100) })}
                                </Typography>
                            </View>
                            {/* A labelled bar rather than a ring: it reuses the
                                ProgressBar atom, needs no SVG, and reads more
                                easily at four moods than a donut would. */}
                            <ProgressBar progress={mood.share} />
                        </View>
                    ))}
                </View>
            )}
        </StatSection>
    );
}

const useStyles = () => StyleSheet.create({
    tiles: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: Spacing.two,
    },
    moods: { gap: Spacing.two },
    mood: { gap: Spacing.one },
    moodHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
});
