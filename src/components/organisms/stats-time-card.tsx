import { StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import Typography from '@/components/atoms/typography';
import BarChart, { type BarDatum } from '@/components/molecules/bar-chart';
import StatSection from '@/components/molecules/stat-section';
import StatTile from '@/components/molecules/stat-tile';
import { Spacing } from '@/constants/theme';
import type { ReadingSummary, StatsRange } from '@/lib/stats';
import { formatMinutes, partOfDayKey } from '@/lib/stats-format';

interface StatsTimeCardProps {
    summary: ReadingSummary;
    range: StatsRange;
}

/** Weekday initials for a dense series; full labels would overlap past ~10 bars. */
const WEEKDAY_KEYS = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'] as const;

export default function StatsTimeCard({ summary, range }: StatsTimeCardProps) {
    const styles = useStyles();
    const { t } = useTranslation();

    // Past a week, per-day labels stop fitting — the shape carries the story.
    const showLabels = summary.byDay.length <= 7;

    const bars: BarDatum[] = summary.byDay.map((bucket) => ({
        key: bucket.key,
        label: t(`you.habits.weekdays.${WEEKDAY_KEYS[bucket.date.getDay()]}`),
        value: bucket.minutes,
    }));

    return (
        <StatSection
            title={t('you.time.sectionTitle')}
            subtitle={t(`you.time.range${range[0].toUpperCase()}${range.slice(1)}`)}
        >
            <View style={styles.tiles}>
                <StatTile label={t('you.time.totalLabel')} value={formatMinutes(summary.totalMinutes, t)} />
                <StatTile label={t('you.time.sessionsLabel')} value={String(summary.sessionCount)} />
                <StatTile label={t('you.time.averageLabel')} value={formatMinutes(summary.averageSessionMinutes, t)} />
                <StatTile label={t('you.time.longestLabel')} value={formatMinutes(summary.longestSessionMinutes, t)} />
            </View>

            <BarChart
                data={bars}
                showLabels={showLabels}
                accessibilityLabel={t('you.time.perDayChartLabel', {
                    range: t(`you.time.range${range[0].toUpperCase()}${range.slice(1)}`).toLowerCase(),
                })}
                testID="stats-day-chart"
            />

            {summary.busiestHour !== null && (
                <Typography variant="caption" color="textSecondary">
                    {t('you.time.partOfDayLine', {
                        partOfDay: t(`you.time.partOfDay.${partOfDayKey(summary.busiestHour)}`),
                    })}
                </Typography>
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
});
