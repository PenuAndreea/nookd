import { StyleSheet, Text, View } from 'react-native';

import { BorderRadius } from '@/constants/theme';

export const POPULAR_FROM = 5;

type Status = {
    label: string;
    emoji: string;
    bg: string;
    fg: string;
    hollow: boolean;
};

// Derived from who is actually in the room, so a badge never claims activity
// the room does not have.
export function statusFor(memberCount: number): Status {
    if (memberCount >= POPULAR_FROM) {
        return { label: 'Popular', emoji: '🔥', bg: '#FDF1DC', fg: '#8A6008', hollow: false };
    }
    if (memberCount > 0) {
        return { label: 'Live', emoji: '', bg: '#E7F4EC', fg: '#2F7A4F', hollow: false };
    }
    return { label: 'Quiet', emoji: '', bg: '#EFEDE9', fg: '#7B7369', hollow: true };
}

export default function StatusBadge({ memberCount }: { memberCount: number }) {
    const status = statusFor(memberCount);

    return (
        <View style={[styles.badge, { backgroundColor: status.bg }]}>
            {status.emoji ? (
                <Text style={styles.emoji}>{status.emoji}</Text>
            ) : (
                <View
                    style={[
                        styles.dot,
                        status.hollow
                            ? { borderColor: status.fg, borderWidth: 1.5 }
                            : { backgroundColor: status.fg },
                    ]}
                />
            )}
            <Text style={[styles.label, { color: status.fg }]}>{status.label}</Text>
        </View>
    );
}

const styles = StyleSheet.create({
    badge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: BorderRadius.full,
    },
    dot: {
        width: 7,
        height: 7,
        borderRadius: 4,
    },
    emoji: {
        fontSize: 11,
    },
    label: {
        fontSize: 11,
        fontWeight: '700',
    },
});
