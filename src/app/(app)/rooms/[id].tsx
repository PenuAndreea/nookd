import { useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { StyleSheet, View } from "react-native";

import { getRoom, Room } from '@/api/nookd';
import Button from '@/components/atoms/button';
import Typography from '@/components/atoms/typography';
import SessionTimer from '@/components/organisms/session-timer';
import { useAuth } from '@/contexts/auth-context';
import { useRoomPresence } from '@/hooks/use-room-presence';


export default function RoomDetailsScreen() {
    const { id } = useLocalSearchParams();
    const [room, setRoom] = useState<Room | undefined>();

    const { session } = useAuth();

    const { members, memberCount, isJoined, elapsedSeconds, joinRoom, leaveRoom } =
        useRoomPresence(room?.id, session?.user.id)


    useEffect(() => {
        if (room?.id && session?.user.id && !isJoined) {
            joinRoom()
        }
    }, [room?.id, session?.user.id])


    useEffect(() => {
        async function loadRoom() {
            try {
                const data = await getRoom(id.toString())

                setRoom(data)
            } catch (error) {
                console.log('Error fetching room:', error)
            }
        }

        loadRoom()
    }, [])

    if (!room) {
        return <View>
            <Typography>no room</Typography>
        </View>
    }

    return (
        <View style={styles.container}>
            <Typography variant='h2'>Name: {room?.name}</Typography>
            <Typography>Description: {room?.description}</Typography>
            <View style={{ alignItems: 'center' }}>
                <SessionTimer
                    startedAt={room?.started_at}
                    durationMinutes={room?.duration_minutes}
                />
            </View>
            <View>
                <Typography>Amount of members: {memberCount}</Typography>
                <Typography>Are you joined ? {isJoined ? 'yes' : 'no'}</Typography>
                <Typography>Elapsed seconds: {elapsedSeconds}</Typography>
            </View>

            <Button title="Leave" size="small" onPress={leaveRoom} />
        </View>
    )
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
        paddingHorizontal: 16,
    },
})