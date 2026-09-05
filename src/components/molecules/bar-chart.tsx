import { StyleSheet, View } from 'react-native';

import Typography from '@/components/atoms/typography';
import { BorderRadius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

export interface BarDatum {
    key: string;
    /** Rendered under the bar. Omit `showLabels` for a dense series. */
    label: string;
    value: number;
}

interface BarChartProps {
    data: BarDatum[];
    /** Height of the plot area in px. */
    height?: number;
    showLabels?: boolean;
    /**
     * A complete sentence describing the chart for VoiceOver, e.g. "Minutes
     * read per day over the last 7 days". The bars themselves are decorative
     * once this is set, so a screen reader hears the summary, not 30 numbers.
     */
    accessibilityLabel: string;
    testID?: string;
}

/**
 * Vertical bars built from plain Views rather than SVG.
 *
 * `react-native-svg` is only pulled in for `.svg` assets here and nothing in
 * the app imports it directly, so it is an untested path in this jest setup.
 * A percentage-height View does everything a bar chart needs — the same
 * technique TimerCard already uses for its progress bar.
 */
export default function BarChart({
    data,
    height = 120,
    showLabels = true,
    accessibilityLabel,
    testID,
}: BarChartProps) {
    const colors = useTheme();
    const styles = createStyles(colors);

    // A day with no reading is a real answer, so an all-zero chart renders as
    // a flat row of minimum-height bars rather than dividing by zero.
    const peak = Math.max(...data.map((datum) => datum.value), 0);

    // A fixed gap eats the whole width once there are many bars: 30 columns at
    // 4px already spend a third of a phone's width on empty space.
    const gap = data.length > 20 ? 1 : data.length > 12 ? 2 : Spacing.one;

    return (
        <View
            testID={testID}
            accessible
            accessibilityRole="image"
            accessibilityLabel={accessibilityLabel}
            style={styles.chart}
        >
            <View style={[styles.plot, { height, gap }]}>
                {data.map((datum) => (
                    <View key={datum.key} style={styles.column}>
                        <View
                            style={[
                                styles.bar,
                                {
                                    // Keeps an empty day visible as a sliver of
                                    // track rather than nothing at all.
                                    height: peak === 0
                                        ? MIN_BAR_HEIGHT
                                        : Math.max((datum.value / peak) * height, MIN_BAR_HEIGHT),
                                    backgroundColor: datum.value === 0
                                        ? colors.progressTrack
                                        : colors.accent,
                                },
                            ]}
                        />
                    </View>
                ))}
            </View>
            {showLabels && (
                <View style={[styles.labels, { gap }]}>
                    {data.map((datum) => (
                        <View key={datum.key} style={styles.column}>
                            <Typography variant="tiny" color="textSecondary" numberOfLines={1}>
                                {datum.label}
                            </Typography>
                        </View>
                    ))}
                </View>
            )}
        </View>
    );
}

const MIN_BAR_HEIGHT = 3;

const createStyles = (colors: ReturnType<typeof useTheme>) => StyleSheet.create({
    chart: { gap: Spacing.two },
    plot: {
        flexDirection: 'row',
        alignItems: 'flex-end',
    },
    column: { flex: 1, alignItems: 'center' },
    bar: {
        width: '100%',
        borderRadius: BorderRadius.small,
        backgroundColor: colors.accent,
    },
    labels: { flexDirection: 'row' },
});
