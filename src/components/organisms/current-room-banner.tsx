import { router } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { RoomWithDetails } from '@/api/rooms';
import Button from '@/components/atoms/button';
import StatusBadge from '@/components/atoms/status-badge';
import Typography from '@/components/atoms/typography';
import { VIBES } from '@/components/molecules/picker';
import RoomThumbnail from '@/components/molecules/room-thumbnail';
import { BorderRadius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

function vibeLabel(vibe: string | null) {
    return VIBES.find((v) => v.id === vibe)?.label.toLowerCase() ?? null;
}

export default function CurrentRoomBanner({ room }: { room: RoomWithDetails }) {
    const colors = useTheme();
    const styles = useStyles(colors);

    const count = room.members?.length ?? 0;
    const vibe = vibeLabel(room.vibe);
    const meta = [`${count} reading`, vibe].filter(Boolean).join(' · ');

    function openRoom() {
        router.push({ pathname: '/room/[id]', params: { id: room.id } });
    }

    return (
        <Pressable
            style={({ pressed }) => [styles.banner, pressed && styles.pressed]}
            onPress={openRoom}
            accessibilityRole="button"
            accessibilityLabel={`Return to ${room.name ?? 'your room'}`}
        >
            <View style={styles.top}>
                <View style={styles.info}>
                    <StatusBadge memberCount={count} />

                    <Typography variant="h1" numberOfLines={1} style={styles.name}>
                        {room.name}
                    </Typography>

                    <Text style={styles.meta} numberOfLines={1}>{meta}</Text>
                </View>

                <RoomThumbnail room={room} width={84} />
            </View>

            <Button
                title="Return to room  →"
                variant="surface"
                fullWidth
                size="large"
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
        fontSize: 14,
        color: colors.bannerTextSecondary,
    },
});
