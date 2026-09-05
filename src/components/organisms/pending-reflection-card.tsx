import { StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import Button from '@/components/atoms/button';
import TextButton from '@/components/atoms/text-button';
import Typography from '@/components/atoms/typography';
import { BorderRadius, Spacing } from '@/constants/theme';
import type { StatsSession } from '@/api/stats';
import { useTheme } from '@/hooks/use-theme';
import { parsePgTimestamp } from '@/lib/date';
import { formatMinutes, formatWhen } from '@/lib/stats-format';

interface PendingReflectionCardProps {
    pending: StatsSession | null;
    /** Opens the reflection sheet, which the screen owns — see below. */
    onOpen: () => void;
    onDismiss: () => void;
}

/**
 * Offers a reflection for a session that ended without the reader being asked
 * — the app was killed, or a timed room ran out while they were elsewhere.
 *
 * Renders nothing when there is nothing owed, which is the usual case.
 *
 * Deliberately does NOT render the reflection sheet itself: a bottom sheet
 * inside a ScrollView is clipped to its container instead of overlaying the
 * screen, so the sheet lives at the screen root and this card only asks for it.
 */
export default function PendingReflectionCard({
    pending,
    onOpen,
    onDismiss,
}: PendingReflectionCardProps) {
    const colors = useTheme();
    const styles = createStyles(colors);
    const { t } = useTranslation();

    if (!pending) return null;

    const endedAt = parsePgTimestamp(pending.ended_at ?? pending.created_at);
    const duration = formatMinutes(pending.duration_minutes ?? 0, t);
    const when = endedAt === null ? '' : formatWhen(new Date(endedAt), t);

    return (
        <View style={styles.card}>
            <Typography variant="cardTitle">{t('you.pendingReflection.title')}</Typography>
            <Typography variant="subtitle" color="textSecondary">
                {pending.room_name
                    ? t('you.pendingReflection.body', {
                        duration, when, roomName: pending.room_name,
                    })
                    : t('you.pendingReflection.bodyNoRoom', { duration, when })}
            </Typography>

            <Button
                title={t('you.pendingReflection.action')}
                size="medium"
                onPress={onOpen}
            />
            <TextButton
                title={t('you.pendingReflection.dismiss')}
                variant="secondary"
                onPress={onDismiss}
            />
        </View>
    );
}

const createStyles = (colors: ReturnType<typeof useTheme>) => StyleSheet.create({
    card: {
        gap: Spacing.two,
        padding: Spacing.three,
        borderRadius: BorderRadius.large,
        backgroundColor: colors.bannerBackground,
    },
});
