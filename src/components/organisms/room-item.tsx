
import { RoomWithDetails } from '@/api/rooms';
import { BorderRadius, Spacing } from '@/constants/theme';
import { useAuth } from '@/contexts/auth-context';
import { useTheme } from '@/hooks/use-theme';
import { router } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import Button from '../atoms/button';
import StatusBadge, { POPULAR_FROM } from '../atoms/status-badge';
import Typography from '../atoms/typography';
import AvatarList from '../molecules/avatar-list';
import RoomThumbnail from '../molecules/room-thumbnail';


export default function RoomItem({ room }: { room: RoomWithDetails }) {
    const colors = useTheme();
    const styles = useStyles(colors);
    const { session } = useAuth();
    const userId = session?.user?.id;
    const { t } = useTranslation();

    const memberIds = room.members?.map((member) => member.user_id) ?? []
    const memberCount = memberIds.length
    const isMember = userId ? memberIds.includes(userId) : false
    const isPopular = memberCount >= POPULAR_FROM

    function openRoom() {
        router.push({ pathname: '/room/[id]', params: { id: room.id } })
    }

    // Joining from here opens the room and lets its existing flow take over —
    // the "leave your current room?" confirmation and the book picker both live
    // there, and duplicating them would mean two copies to keep in step.
    function joinRoom() {
        router.push({ pathname: '/room/[id]', params: { id: room.id, autojoin: '1' } })
    }

    return (
        <Pressable
            style={({ pressed }) => [
                styles.container,
                isPopular && styles.highlighted,
                pressed && styles.pressed,
            ]}
            onPress={openRoom}
        >
            <RoomThumbnail room={room} stretch />

            <View style={styles.info}>
                <View style={styles.titleRow}>
                    <Typography variant="h2" color="sheetText" numberOfLines={1} style={styles.title}>
                        {room.name}
                    </Typography>
                    <StatusBadge memberCount={memberCount} />
                </View>

                {room.description && (
                    <Typography numberOfLines={2} color="sheetTextSecondary">
                        {room.description}
                    </Typography>
                )}

                {room.book && (
                    <Typography numberOfLines={1} color="sheetTextSecondary" style={{ marginTop: 2 }}>
                        📖 {room.book.title}
                    </Typography>
                )}

                <View style={styles.footerRow}>
                    <AvatarList userIds={memberIds} />
                    {!isMember && <Button title={t('rooms.join')} size="small" onPress={joinRoom} />}
                </View>
            </View>
        </Pressable>
    )
}


const useStyles = (colors: ReturnType<typeof useTheme>) => StyleSheet.create({
    pressed: {
        opacity: 0.92,
        transform: [{ scale: 0.98 }],
    },
    container: {
        flexDirection: 'row',
        padding: Spacing.three,
        marginBottom: Spacing.two,
        backgroundColor: colors.white,
        borderWidth: 1,
        borderRadius: BorderRadius.medium,
        borderColor: colors.border,
        boxShadow: ' rgba(0, 0, 0, 0.1) 0px 1px 3px 0px, rgba(0, 0, 0, 0.06) 0px 1px 2px 0px',
    },
    highlighted: {
        borderColor: colors.accent,
        borderWidth: 1.5,
    },
    info: {
        flex: 1,
        marginLeft: Spacing.three,
    },
    titleRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: Spacing.two,
    },
    title: {
        flexShrink: 1,
        marginBottom: 0,
    },
    footerRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginTop: Spacing.two,
        gap: Spacing.two,
    },
});
