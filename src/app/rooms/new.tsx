import { StyleSheet, View } from 'react-native';

import { supabase } from '@/lib/supabase';
import { router } from 'expo-router';

export default function CreateRoomScreen() {


    async function createRoom() {

        const { data, error } = await supabase.from('rooms').insert({ name: 'New Room 3' }).select()

        if (error) {
            console.error('Error creating room:', error)
        } else {
            // go to room page
            router.navigate(`/rooms/${data.id}`);
        }
    }

    return (
        <View style={styles.container}>
            {/* TODO: create room form */}
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
