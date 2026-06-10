import { useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { StyleSheet, View } from "react-native";

import { getRoom, Room } from '@/api/nookd';
import Typography from '@/components/atoms/typography';
import SessionTimer from '@/components/organisms/session-timer';


export default function RoomDetailsScreen() {
    const { id } = useLocalSearchParams();
    const [room, setRoom] = useState<Room | undefined>();

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

            <Typography>Participants:</Typography>

        </View>
    )
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        paddingHorizontal: 16,
    },
})