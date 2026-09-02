import { router } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { RoomWithDetails } from '@/api/rooms';
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
                    {/* TODO: reuse StatusBadge */}
                    <View style={styles.liveRow}>
                        <View style={styles.liveDot} />
                        <Text style={styles.liveText}>LIVE NOW</Text>
                    </View>

                    <Typography variant="h1" numberOfLines={1} style={styles.name}>
                        {room.name}
                    </Typography>

                    <Text style={styles.meta} numberOfLines={1}>{meta}</Text>
                </View>

                <RoomThumbnail room={room} width={84} />
            </View>

            {/* TODO: use custom button component */}
            <View style={styles.returnButton}>
                <Text style={styles.returnText}>Return to room  →</Text>
            </View>
        </Pressable>
    );
}

const useStyles = (colors: ReturnType<typeof useTheme>) => StyleSheet.create({
    banner: {
        backgroundColor: '#FBF0D2',
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
        gap: 2,
    },
    liveRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    liveDot: {
        width: 7,
        height: 7,
        borderRadius: 4,
        backgroundColor: '#C99A18',
    },
    liveText: {
        fontSize: 11,
        fontWeight: '700',
        letterSpacing: 0.8,
        color: '#8A6008',
    },
    name: {
        marginBottom: 0,
    },
    meta: {
        fontSize: 14,
        color: '#8A7A55',
    },
    returnButton: {
        backgroundColor: colors.white,
        borderRadius: BorderRadius.full,
        paddingVertical: 14,
        alignItems: 'center',
    },
    returnText: {
        fontSize: 16,
        fontWeight: '700',
        color: colors.text,
    },
});
