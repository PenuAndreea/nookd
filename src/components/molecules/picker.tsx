import { StyleSheet, Text, View } from 'react-native';

import Chip from '@/components/atoms/chip';
import { useTheme } from '@/hooks/use-theme';

export const VIBES = [
    { id: 'book_club', label: 'BookClub', emoji: '👥' },
    { id: 'fantasy', label: 'Fantasy', emoji: '🐉' },
    { id: 'nonfiction', label: 'Nonfiction', emoji: '📰' },
    { id: 'quiet_company', label: 'Quiet Company', emoji: '✨' },
    { id: 'lost_in_a_book', label: 'Lost in a Book', emoji: '📖' },
];

// Post-session check-in — how the session felt, not the room's ambiance
// (that's MOODS above). Kept as a separate value set on purpose.
const SESSION_MOODS = [
    { id: 'focused', label: 'Focused', emoji: '🎯' },
    { id: 'cozy', label: 'Cozy', emoji: '🕯️' },
    { id: 'distracted', label: 'Distracted', emoji: '🌀' },
    { id: 'restless', label: 'Restless', emoji: '🌊' },
];

const DURATIONS = [
    { id: '10', label: '10 min' },
    { id: '15', label: '15 min' },
    { id: '30', label: '30 min' },
    { id: '60', label: '60 min' },
];

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

export const VibePicker = ({ value, onChange }: MoodPickerProps) => (
    <ChipGrid label="Vibe" options={VIBES} value={value} onChange={onChange} twoPerRow />
);

export const SessionMoodPicker = ({ value, onChange }: MoodPickerProps) => (
    <ChipGrid label="How was this session?" options={SESSION_MOODS} value={value} onChange={onChange} twoPerRow />
);

interface DurationPickerProps {
    value: string | null;
    onChange: (id: string) => void;
}

export const DurationPicker = ({ value, onChange }: DurationPickerProps) => (
    <ChipGrid label="Duration" options={DURATIONS} value={value} onChange={onChange} />
);

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
