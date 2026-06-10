import { useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { StyleSheet, View } from "react-native";

import { getRoom, getRoomMembersByRoomId, Room } from '@/api/nookd';
import Avatar from '@/components/atoms/avatar';
import Typography from '@/components/atoms/typography';
import SessionTimer from '@/components/organisms/session-timer';


export default function RoomDetailsScreen() {
    const { id } = useLocalSearchParams();
    const [room, setRoom] = useState<Room | undefined>();
    const [members, setMembers] = useState();

    useEffect(() => {
        async function loadRoom() {
            try {
                const data = await getRoom(id.toString())
                // TODO: transform data to profile
                const roomMembers = await getRoomMembersByRoomId(id.toString())

                setRoom(data)
                setMembers(roomMembers)
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