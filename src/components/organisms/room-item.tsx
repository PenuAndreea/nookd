
import { Room } from '@/app/rooms/types';
import { BorderRadius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { router } from 'expo-router';
import { Image, StyleSheet, View } from 'react-native';

import { getProfile, getRoomMembersByRoomId } from '@/api/nookd';
import { useEffect, useState } from 'react';
import Button from '../atoms/button';
import Typography from '../atoms/typography';
import AvatarList from '../molecules/avatar-list';

export default function RoomItem({ room }: { room: Room }) {
    const colors = useTheme();
    const styles = useStyles(colors);
    const BOOK_URI = `https://covers.openlibrary.org/b/isbn/${room.isbn}-L.jpg`

    const [host, setHost] = useState<string | null>(null)
    const [members, setMembers] = useState<string[] | undefined>(undefined)

    function navigateToRoomDetails(roomId: string) {
        router.navigate(`/rooms/${roomId}`);
    }

    useEffect(() => {
        async function getHost(id: string) {
            const myHost = await getProfile(id)
            setHost(myHost?.username ?? null)
        }

        if (room.host_id) {
            getHost(room.host_id)
        }
    }, [room.host_id])

    useEffect(() => {
        async function getRoomMembers() {
            const myMembers = await getRoomMembersByRoomId(room.id)
            setMembers(myMembers)
        }

        getRoomMembers()
    }, [room.id])

    return (
        <View style={styles.container}>
            <Image
                style={styles.image}
                source={{ uri: BOOK_URI }}
            />
            <View style={styles.info}>
                <View style={{ justifyContent: 'flex-start' }}>
                    <Typography variant="h2">
                        {room.name}
                    </Typography>
                    <Typography>
                        {room.description}
                    </Typography>
                </View>
                <View style={styles.participants}>
                    <Typography>
                        Hosted by: {host}
                    </Typography>
                    <AvatarList userIds={members} />
                </View>
            </View>
            <View style={styles.button}>
                <Button title="Join" size="small" onPress={() => navigateToRoomDetails(room.id)} />
            </View>
        </View>
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
    },
    participants: {
        flex: 1,
        justifyContent: 'flex-end',
        marginTop: Spacing.two
    },
    image: {
        width: 60,
        aspectRatio: 2 / 3,
        borderRadius: BorderRadius.small,
    },
    info: {
        flex: 1,
        marginLeft: Spacing.three
    },
    button: {
        justifyContent: 'flex-end'
    }
});
