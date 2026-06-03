import { useEffect, useState } from 'react';
import { Button, FlatList, StyleSheet, Text, View } from 'react-native';

import { supabase } from '@/lib/supabase';

export default function Rooms() {
    const [rooms, setRooms] = useState([])

    async function getRooms() {
        const { data } = await supabase.from('rooms').select()
        setRooms(data)
    }

    useEffect(() => {
        getRooms()
    }, [])

    async function createRoom() {
        const { data, error } = await supabase.from('rooms').insert({ name: 'New Room 2' }).select()

        if (error) {
            console.error('Error creating room:', error)
        } else {
            setRooms(data)
        }
    }

    return (
        <View style={styles.container}>
            <FlatList
                data={rooms}
                keyExtractor={(item) => item.id.toString()}
                renderItem={({ item }) => (
                    <Text style={styles.item}>{item.name}</Text>
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
});
