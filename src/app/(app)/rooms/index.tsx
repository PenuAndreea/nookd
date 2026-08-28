import { useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, StyleSheet, View } from 'react-native';

import { getRooms, RoomWithDetails } from '@/api/nookd';
import Typography from '@/components/atoms/typography';
import RoomItem from '@/components/organisms/room-item';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

export default function RoomsScreen() {
    const [rooms, setRooms] = useState<RoomWithDetails[] | null>(null)
    const colors = useTheme();
    const styles = useStyles(colors);
    const [loading, setIsLoading] = useState(false)

    useEffect(() => {
        let isActive = true;

        async function loadRooms() {
            try {
                setIsLoading(true)
                const data = await getRooms()

                if (!isActive) return;

                setRooms(data)
            } catch (error) {
                console.error('Error loading rooms:', error)
            } finally {
                setIsLoading(false)
            }
        }

        loadRooms()

        return () => {
            isActive = false;
        }
    }, [])

    return (
        <View style={styles.container}>
            <View style={{ marginVertical: 8 }}>
                <Typography variant='h1'>Silent Rooms</Typography>
            </View>
            {loading ?
                <ActivityIndicator size="large" style={{ justifyContent: 'center', alignSelf: 'center', alignItems: 'center', alignContent: 'center', height: '80%' }} color={colors.accent} /> :
                <FlatList
                    showsVerticalScrollIndicator={false}
                    contentContainerStyle={styles.listContent}
                    data={rooms}
                    keyExtractor={(item) => item.id.toString()}
                    renderItem={({ item }) => <RoomItem room={item} />}
                />}
        </View>
    )
}

const useStyles = (colors: any) => StyleSheet.create({
    container: {
        flex: 1,
        marginTop: Spacing.six,
        marginHorizontal: Spacing.three,
        backgroundColor: colors.background,
    },
    listContent: {
        paddingTop: Spacing.three,
    },
});
