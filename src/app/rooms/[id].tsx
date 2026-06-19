import { useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { StyleSheet, View } from "react-native";

import { getRoom, Room } from '@/api/nookd';
import Avatar from '@/components/atoms/avatar';
import Button from '@/components/atoms/button';
import Typography from '@/components/atoms/typography';
import SessionTimer from '@/components/organisms/session-timer';
import { useRoomPresence } from '@/hooks/use-room-presence';


export default function RoomDetailsScreen() {
    const { id } = useLocalSearchParams();
    const [room, setRoom] = useState<Room | undefined>();

    const { members, memberCount, isJoined, elapsedSeconds, leaveRoom } =
        useRoomPresence(room?.id, '1de8b434-3848-464a-8b31-9f08f262ed11')

    console.log(members, memberCount, isJoined, elapsedSeconds)
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
            {members.map((member) => (
                <View key={member.profiles.id} style={{ flexDirection: 'row', }}>
                    <Avatar id={member.profiles.id} size="medium" />
                    <Typography>{member.profiles.username}</Typography>
                </View>
            ))}

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