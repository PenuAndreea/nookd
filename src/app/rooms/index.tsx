import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { FlatList, StyleSheet, View } from 'react-native';

import { getRooms } from '@/api/nookd';
import Button from '@/components/atoms/button';
import RoomItem from '@/components/organisms/room-item';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { Room } from './types';


export default function RoomsScreen() {
    const [rooms, setRooms] = useState<Room[] | null>(null)
    const colors = useTheme();
    const styles = useStyles(colors);

    async function loadRooms() {
        const data = await getRooms()
        setRooms(data)
    }

    useEffect(() => {
        loadRooms()
    }, [])

    function navigateToCreateRoom() {
        router.navigate(`/rooms/new`);
    }

    return (
        <View style={styles.container}>
            <FlatList
                contentContainerStyle={styles.listContent}
                data={rooms}
                keyExtractor={(item) => item.id.toString()}
                renderItem={({ item }) => (
                    <RoomItem room={item} />
                )}
            />
            <Button
                floating
                title="+"
                size="large"
                onPress={navigateToCreateRoom}
            />
        </View>
    )
}

const useStyles = (colors: any) => StyleSheet.create({
    listContent: {
        paddingTop: Spacing.three,
    },
    container: {
        flex: 1,
        marginHorizontal: Spacing.three,
        backgroundColor: colors.background,
    },
});
