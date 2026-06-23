import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

const MOODS = [
    { id: 'morning', label: 'Morning', emoji: '☀️' },
    { id: 'golden', label: 'Golden Hour', emoji: '🌅' },
    { id: 'quiet', label: 'Quiet Company', emoji: '✨' },
    { id: 'lost', label: 'Lost in a Book', emoji: '📖' }
];

const DURATIONS = [
    { id: '10', label: '10 min' },
    { id: '15', label: '15 min' },
    { id: '30', label: '30 min' },
    { id: '60', label: '60 min' },
];

interface MoodPickerProps {
    value: string | null;
    onChange: (id: string) => void;
}

export const MoodPicker = ({ value, onChange }: MoodPickerProps) => (
    <View style={styles.wrapper}>
        <Text style={styles.label}>Mood</Text>
        <View style={styles.moodGrid}>
            {MOODS.map(mood => {
                const selected = value === mood.id;
                return (
                    <TouchableOpacity
                        key={mood.id}
                        style={[styles.moodChip, selected && styles.moodChipSelected]}
                        onPress={() => onChange(mood.id)}
                        activeOpacity={0.7}
                    >
                        <Text style={styles.moodEmoji}>{mood.emoji}</Text>
                        <Text style={[styles.moodText, selected && styles.moodTextSelected]}>
                            {mood.label}
                        </Text>
                    </TouchableOpacity>
                );
            })}
        </View>
    </View>
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