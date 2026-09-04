import { StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { TypographyStyles } from './typography';
import { BorderRadius } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

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
function statusFor(memberCount: number, colors: ReturnType<typeof useTheme>, t: (key: string) => string): Status {
    if (memberCount >= POPULAR_FROM) {
        return { label: t('rooms.status.popular'), emoji: '🔥', bg: colors.statusPopularBg, fg: colors.statusPopularFg, hollow: false };
    }
    if (memberCount > 0) {
        return { label: t('rooms.status.live'), emoji: '', bg: colors.statusLiveBg, fg: colors.statusLiveFg, hollow: false };
    }
    return { label: t('rooms.status.quiet'), emoji: '', bg: colors.statusQuietBg, fg: colors.statusQuietFg, hollow: true };
}

export default function StatusBadge({ memberCount }: { memberCount: number }) {
    const colors = useTheme();
    const { t } = useTranslation();
    const status = statusFor(memberCount, colors, t);

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
        // A pill, not a bar: without this it stretches to fill its parent's
        // cross axis whenever that parent is a column with default
        // alignItems (e.g. stacked in current-room-banner's info column,
        // rather than a title row like RoomItem's, where the row's own
        // main-axis sizing already kept it content-width).
        alignSelf: 'flex-start',
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
        ...TypographyStyles.tinyBold,
    },
});
