import { useLocalSearchParams } from 'expo-router';
import { StyleSheet, Text, View } from "react-native";


export default function RoomDetailsScreen() {
    const { id } = useLocalSearchParams();
    // TODO: get other data about room fetch from supabase using id

    return (
        <View style={styles.container}>
            <Text>Room Details: {id}</Text>
            {/* TODO: Room name */}
            {/* TODO: Timer */}
            {/* TODO: Status */}
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
})