import { useEffect, useState } from 'react';
import { FlatList, StyleSheet, View } from 'react-native';

import { getRoomsWithDetails, RoomWithDetails } from '@/api/nookd';
import Typography from '@/components/atoms/typography';
import RoomItem from '@/components/organisms/room-item';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import KidsReading from "../../../assets/images/illustrations/reading-book-cuate.svg";

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
                const data = await getRoomsWithDetails()

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
            <View style={{ margin: 8 }}>
                <Typography variant='h1'>Silent Rooms</Typography>
            </View>
            {loading ?
                <View style={{ alignItems: 'center' }}>
                    <KidsReading width={400} height={400} />
                    <Typography color="textSecondary">Loading...</Typography>
                </View> :
                <FlatList
                    showsVerticalScrollIndicator={false}
                    contentContainerStyle={styles.listContent}
                    data={rooms}
                    keyExtractor={(item) => item.id.toString()}
                    renderItem={({ item }) => (
                        <RoomItem room={item} />
                    )}
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
