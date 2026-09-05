import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Pressable, StyleSheet, View } from 'react-native';

import { RoomWithDetails } from '@/api/rooms';
import Button from '@/components/atoms/button';
import StatusBadge from '@/components/atoms/status-badge';
import Typography from '@/components/atoms/typography';
import { VIBES } from '@/components/molecules/picker';
import RoomThumbnail from '@/components/molecules/room-thumbnail';
import { BorderRadius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

function vibeLabel(vibe: string | null, t: (key: string) => string) {
    const found = VIBES.find((v) => v.id === vibe);
    return found ? t(`rooms.vibes.${found.id}`).toLowerCase() : null;
}

export default function CurrentRoomBanner({ room }: { room: RoomWithDetails }) {
    const colors = useTheme();
    const styles = useStyles(colors);
    const { t } = useTranslation();

    const count = room.members?.length ?? 0;
    const vibe = vibeLabel(room.vibe, t);
    const meta = [t('rooms.reading', { count }), vibe].filter(Boolean).join(' · ');

    function openRoom() {
        router.push({ pathname: '/room/[id]', params: { id: room.id } });
    }

    return (
        <Pressable
            style={({ pressed }) => [styles.banner, pressed && styles.pressed]}
            onPress={openRoom}
            accessibilityRole="button"
            accessibilityLabel={t('rooms.returnToRoomAccessibility', { roomName: room.name ?? t('rooms.fallbackRoomName') })}
        >
            <View style={styles.top}>
                <View style={styles.info}>
                    <StatusBadge memberCount={count} />

                    <Typography variant="h2" numberOfLines={1} style={styles.name}>
                        {room.name}
                    </Typography>

                    <Typography style={styles.meta} numberOfLines={1}>{meta}</Typography>
                </View>

                <RoomThumbnail room={room} width={84} />
            </View>

            <Button
                title={t('rooms.returnToRoom')}
                variant="surface"
                fullWidth
                size="medium"
                onPress={openRoom}
            />
        </Pressable>
    );
}

const useStyles = (colors: ReturnType<typeof useTheme>) => StyleSheet.create({
    banner: {
        backgroundColor: colors.bannerBackground,
        borderRadius: BorderRadius.large,
        padding: Spacing.three,
        marginBottom: Spacing.three,
        gap: Spacing.three,
    },
    pressed: {
        opacity: 0.94,
    },
    top: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.three,
    },
    info: {
        flex: 1,
        gap: 4,
    },
    name: {
        marginBottom: 0,
    },
    meta: {
        color: colors.bannerTextSecondary,
    },
});
