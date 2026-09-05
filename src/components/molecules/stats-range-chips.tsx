import { StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import Chip from '@/components/atoms/chip';
import { Spacing } from '@/constants/theme';
import type { StatsRange } from '@/lib/stats';

export const STATS_RANGES: StatsRange[] = ['week', 'month', 'year'];

interface StatsRangeChipsProps {
    value: StatsRange;
    onChange: (range: StatsRange) => void;
}

/** Which window the You tab is showing. Same chip row as every other picker. */
export function StatsRangeChips({ value, onChange }: StatsRangeChipsProps) {
    const styles = useStyles();
    const { t } = useTranslation();

    return (
        <View style={styles.row} accessibilityLabel={t('you.range.label')}>
            {STATS_RANGES.map((range) => (
                <Chip
                    key={range}
                    label={t(`you.range.${range}`)}
                    selected={value === range}
                    onPress={() => onChange(range)}
                />
            ))}
        </View>
    );
}

const useStyles = () => StyleSheet.create({
    row: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: Spacing.two,
    },
});
