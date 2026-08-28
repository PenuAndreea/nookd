
import { RoomWithDetails } from '@/api/rooms';
import { BorderRadius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { router } from 'expo-router';
import { Image, Pressable, StyleSheet, View } from 'react-native';

import Typography from '../atoms/typography';
import AvatarList from '../molecules/avatar-list';

import Chilling from '../../../assets/images/illustrations/cuate/chilling.svg';
import KidsReading from '../../../assets/images/illustrations/cuate/kids-reading.svg';
import ReadingBook from "../../../assets/images/illustrations/cuate/reading-book.svg";
import StayHome from '../../../assets/images/illustrations/cuate/stay-at-home.svg';
import StayIn from '../../../assets/images/illustrations/cuate/staying-in.svg';
import WomanReading from '../../../assets/images/illustrations/cuate/woman-reading.svg';

const ROOM_ILLUSTRATIONS = [KidsReading, ReadingBook, StayHome, StayIn, WomanReading, Chilling]

export default function RoomItem({ room }: { room: RoomWithDetails }) {
    const colors = useTheme();
    const styles = useStyles(colors);

    const hashId = (id: string) =>
        id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0)

    const getIllustration = (index: number) =>
        ROOM_ILLUSTRATIONS[index % ROOM_ILLUSTRATIONS.length]

    const Illustration = getIllustration(hashId(room?.id))

    function navigateToRoomDetails(roomId: RoomWithDetails['id']) {
        router.push({ pathname: '/room/[id]', params: { id: roomId } })
    }

    return (
        <Pressable
            style={({ pressed }) => [styles.container, pressed && styles.pressed]}
            onPress={() => navigateToRoomDetails(room?.id)}
        >
            <View style={{ width: 80, height: 80, backgroundColor: room.book?.cover_url ? 'transparent' : '#F2ECE3', borderRadius: 12, flexWrap: 'wrap', overflow: 'hidden' }}>
                {room.book?.cover_url ? (
                    <Image source={{ uri: room.book.cover_url }} style={{ width: 80, height: 80 }} resizeMode="contain" />
                ) : (
                    <Illustration height={80} width={80} />
                )}
            </View>
            <View style={styles.info}>
                <View style={{ justifyContent: 'flex-start' }}>
                    <Typography variant="h2">
                        {room.name}
                    </Typography>
                    <Typography numberOfLines={2} color="textSecondary">
                        {room.description}
                    </Typography>
                    {room.book && (
                        <Typography numberOfLines={1} color="textSecondary" style={{ marginTop: 2 }}>
                            📖 {room.book.title}
                        </Typography>
                    )}
                    {room?.members && room?.members.length > 0 && <AvatarList userIds={room?.members?.map((member) => member.user_id)} />}
                </View>
            </View>
        </Pressable>
    )
}


const useStyles = (colors: any) => StyleSheet.create({
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
        borderColor: colors.background,
        boxShadow: ' rgba(0, 0, 0, 0.1) 0px 1px 3px 0px, rgba(0, 0, 0, 0.06) 0px 1px 2px 0px',
    },
    participants: {
        flex: 1,
        justifyContent: 'flex-end',
        marginTop: Spacing.two
    },
    info: {
        flex: 1,
        marginLeft: Spacing.three
    },
});
