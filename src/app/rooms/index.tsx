import { useEffect, useState } from 'react';
import { FlatList, StyleSheet, View } from 'react-native';

import { getRoomsWithDetails, RoomWithDetails } from '@/api/nookd';
import RoomItem from '@/components/organisms/room-item';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

export default function RoomsScreen() {
    const [rooms, setRooms] = useState<RoomWithDetails[] | null>(null)
    const colors = useTheme();
    const styles = useStyles(colors);

    useEffect(() => {
        let isActive = true;

        async function loadRooms() {
            try {
                const data = await getRoomsWithDetails()

                if (!isActive) return;

                setRooms(data)
            } catch (error) {
                console.error('Error loading rooms:', error)
            }
        }

        loadRooms()

        return () => {
            isActive = false;
        }
    }, [])

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
        </View>
    )
}

const useStyles = (colors: any) => StyleSheet.create({
    container: {
        flex: 1,
        marginVertical: Spacing.six,
        marginHorizontal: Spacing.three,
        backgroundColor: colors.background,
    },
    listContent: {
        paddingTop: Spacing.three,
    },
});
