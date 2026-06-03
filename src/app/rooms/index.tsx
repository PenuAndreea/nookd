import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { Button, FlatList, Pressable, StyleSheet, Text, View } from 'react-native';

import { supabase } from '@/lib/supabase';
import { Room } from './types';

export default function RoomsScreen() {
    const [rooms, setRooms] = useState<Room[] | null>(null)

    async function getRooms() {
        const { data } = await supabase.from('rooms').select()
        setRooms(data)
    }

    useEffect(() => {
        getRooms()
    }, [])

    async function createRoom() {
        router.navigate(`/rooms/new`);
    }

    function navigateToRoomDetails(roomId: number) {
        router.navigate(`/rooms/${roomId}`);
    }

    return (
        <View style={styles.container}>
            <FlatList
                data={rooms}
                keyExtractor={(item) => item.id.toString()}
                renderItem={({ item }) => (
                    <Pressable 
                        style={({ pressed }) => pressed && styles.pressed} 
                        onPress={() => navigateToRoomDetails(item.id)}
                    >
                        <Text style={styles.item}>{item.name}</Text>
                    </Pressable>
                )}
            />
            <Button title="Create Room" onPress={createRoom} />
        </View>
    )
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
        paddingVertical: 150,
        paddingHorizontal: 16,
    },
    item: {
        padding: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#ccc',
    },
    pressed: {
        backgroundColor: '#eee',
    },
});
