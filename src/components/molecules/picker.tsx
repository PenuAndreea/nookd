import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

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
}

const ChipGrid = ({ label, options, value, onChange }: ChipGridProps) => (
    <View style={styles.wrapper}>
        <Text style={styles.label}>{label}</Text>
        <View style={styles.moodGrid}>
            {options.map(option => {
                const selected = value === option.id;
                return (
                    <TouchableOpacity
                        key={option.id}
                        style={[styles.moodChip, selected && styles.moodChipSelected]}
                        onPress={() => onChange(option.id)}
                        activeOpacity={0.7}
                    >
                        {option.emoji && <Text style={styles.moodEmoji}>{option.emoji}</Text>}
                        <Text style={[styles.moodText, selected && styles.moodTextSelected]}>
                            {option.label}
                        </Text>
                    </TouchableOpacity>
                );
            })}
        </View>
    </View>
);

interface MoodPickerProps {
    value: string | null;
    onChange: (id: string) => void;
}

export const VibePicker = ({ value, onChange }: MoodPickerProps) => (
    <ChipGrid label="Vibe" options={VIBES} value={value} onChange={onChange} />
);

export const SessionMoodPicker = ({ value, onChange }: MoodPickerProps) => (
    <ChipGrid label="How was this session?" options={SESSION_MOODS} value={value} onChange={onChange} />
);

interface DurationPickerProps {
    value: string | null;
    onChange: (id: string) => void;
}

export const DurationPicker = ({ value, onChange }: DurationPickerProps) => (
    <View style={styles.wrapper}>
        <Text style={styles.label}>Duration</Text>
        <View style={styles.durationRow}>
            {DURATIONS.map(duration => {
                const selected = value === duration.id;
                return (
                    <TouchableOpacity
                        key={duration.id}
                        style={[styles.durationChip, selected && styles.durationChipSelected]}
                        onPress={() => onChange(duration.id)}
                        activeOpacity={0.7}
                    >
                        <Text style={[styles.durationText, selected && styles.durationTextSelected]}>
                            {duration.label}
                        </Text>
                    </TouchableOpacity>
                );
            })}
        </View>
    </View>
);

const styles = StyleSheet.create({
    wrapper: {
        gap: 6,
    },
    label: {
        fontSize: 12,
        fontWeight: '600',
        color: '#888',
        textTransform: 'uppercase',
        letterSpacing: 0.6,
    },

    // Mood
    moodGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
    },
    moodChip: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        backgroundColor: '#fff',
        borderRadius: 12,
        borderWidth: 0.5,
        borderColor: '#e0e0e0',
        paddingHorizontal: 14,
        paddingVertical: 10,
        width: '47%',
    },
    moodChipSelected: {
        backgroundColor: '#FFF3D6',
        borderWidth: 1.5,
        borderColor: '#f0b429',
    },
    moodEmoji: {
        fontSize: 18,
    },
    moodText: {
        fontSize: 13,
        fontWeight: '600',
        color: '#555',
    },
    moodTextSelected: {
        color: '#5a3a00',
    },

    // Duration
    durationRow: {
        flexDirection: 'row',
        gap: 8,
    },
    durationChip: {
        flex: 1,
        alignItems: 'center',
        backgroundColor: '#fff',
        borderRadius: 12,
        borderWidth: 0.5,
        borderColor: '#e0e0e0',
        paddingVertical: 11,
    },
    durationChipSelected: {
        backgroundColor: '#FFF3D6',
        borderWidth: 1.5,
        borderColor: '#f0b429',
    },
    durationText: {
        fontSize: 13,
        fontWeight: '600',
        color: '#888',
    },
    durationTextSelected: {
        color: '#5a3a00',
    },
});
