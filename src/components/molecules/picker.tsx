import { StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import Chip from '@/components/atoms/chip';
import { useTheme } from '@/hooks/use-theme';

// `id` is persisted directly to the database (e.g. `rooms.vibe`) — it must
// stay stable across locales. Only the display label is translated, via
// `rooms.vibes.<id>` / `rooms.sessionMoods.<id>` at render time.
export const VIBES = [
    { id: 'book_club', emoji: '👥' },
    { id: 'fantasy', emoji: '🐉' },
    { id: 'nonfiction', emoji: '📰' },
    { id: 'quiet_company', emoji: '✨' },
    { id: 'lost_in_a_book', emoji: '📖' },
];

// Post-session check-in — how the session felt, not the room's ambiance
// (that's MOODS above). Kept as a separate value set on purpose.
const SESSION_MOODS = [
    { id: 'focused', emoji: '🎯' },
    { id: 'cozy', emoji: '🕯️' },
    { id: 'distracted', emoji: '🌀' },
    { id: 'restless', emoji: '🌊' },
];

const DURATIONS = ['10', '15', '30', '60'];

interface ChipGridProps {
    label: string;
    options: { id: string; label: string; emoji?: string }[];
    value: string | null;
    onChange: (id: string) => void;
    /** Two per row (mood/vibe grid) instead of one flexible row (duration). */
    twoPerRow?: boolean;
}

const ChipGrid = ({ label, options, value, onChange, twoPerRow }: ChipGridProps) => {
    const colors = useTheme();
    const styles = createStyles(colors);

    return (
        <View style={styles.wrapper}>
            <Text style={styles.label}>{label}</Text>
            <View style={styles.grid}>
                {options.map(option => (
                    <Chip
                        key={option.id}
                        label={option.label}
                        emoji={option.emoji}
                        selected={value === option.id}
                        onPress={() => onChange(option.id)}
                        style={twoPerRow ? styles.twoPerRowChip : styles.flexChip}
                    />
                ))}
            </View>
        </View>
    );
};

interface MoodPickerProps {
    value: string | null;
    onChange: (id: string) => void;
}

export const VibePicker = ({ value, onChange }: MoodPickerProps) => {
    const { t } = useTranslation();
    const options = VIBES.map((vibe) => ({ ...vibe, label: t(`rooms.vibes.${vibe.id}`) }));
    return <ChipGrid label={t('rooms.vibePickerLabel')} options={options} value={value} onChange={onChange} twoPerRow />;
};

export const SessionMoodPicker = ({ value, onChange }: MoodPickerProps) => {
    const { t } = useTranslation();
    const options = SESSION_MOODS.map((mood) => ({ ...mood, label: t(`rooms.sessionMoods.${mood.id}`) }));
    return <ChipGrid label={t('rooms.sessionMoodPickerLabel')} options={options} value={value} onChange={onChange} twoPerRow />;
};

interface DurationPickerProps {
    value: string | null;
    onChange: (id: string) => void;
}

export const DurationPicker = ({ value, onChange }: DurationPickerProps) => {
    const { t } = useTranslation();
    const options = DURATIONS.map((minutes) => ({ id: minutes, label: t('rooms.durationOption', { minutes }) }));
    return <ChipGrid label={t('rooms.durationPickerLabel')} options={options} value={value} onChange={onChange} />;
};

const createStyles = (colors: ReturnType<typeof useTheme>) => StyleSheet.create({
    wrapper: {
        gap: 6,
    },
    label: {
        fontSize: 12,
        fontWeight: '600',
        color: colors.textSecondary,
        textTransform: 'uppercase',
        letterSpacing: 0.6,
    },
    grid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
    },
    twoPerRowChip: {
        flexBasis: '47%',
    },
    flexChip: {
        flex: 1,
    },
});
