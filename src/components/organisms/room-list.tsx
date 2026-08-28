import { ActivityIndicator, FlatList, RefreshControl, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { router } from 'expo-router';

import BookLover from '@/assets/images/illustrations/cuate/book-lover.svg';
import { Icon } from '@/components/atoms/icon';
import Typography from '@/components/atoms/typography';
import { Spacing } from '@/constants/theme';
import { useRooms } from '@/contexts/rooms-context';
import { useTheme } from '@/hooks/use-theme';
import RoomItem from './room-item';

export default function RoomList() {
    const { rooms, currentRoom, loading, refreshing, refresh } = useRooms();
    const colors = useTheme();
    const styles = useStyles(colors);

    const otherRooms = rooms?.filter((room) => room.id !== currentRoom?.id) ?? null;

    // The "Rooms" section is only worth showing when there is something to put
    // in it, or when there is nothing anywhere and the empty state is the whole
    // point. Being in the only existing room is not an empty state.
    const showOtherRooms = loading || !currentRoom || (otherRooms?.length ?? 0) > 0;

    function createRoom() {
        router.push('/create-room')
    }

    return (
        <View style={styles.container}>
            <View style={{ marginVertical: 8 }}>
                <Typography variant='h1'>Silent Rooms</Typography>
            </View>
            {currentRoom && (
                <View style={styles.currentRoomSection}>
                    <Text style={styles.sectionLabel}>Current room</Text>
                    <RoomItem room={currentRoom} />
                </View>
            )}
            {showOtherRooms && <Text style={styles.sectionLabel}>Rooms</Text>}
            {loading ?
                <ActivityIndicator size="large" style={{ justifyContent: 'center', alignSelf: 'center', alignItems: 'center', alignContent: 'center', height: '80%' }} color={colors.accent} /> :
                <FlatList
                    showsVerticalScrollIndicator={false}
                    contentContainerStyle={styles.listContent}
                    data={otherRooms}
                    keyExtractor={(item) => item.id.toString()}
                    renderItem={({ item }) => item && <RoomItem room={item} />}
                    refreshControl={
                        <RefreshControl refreshing={refreshing} onRefresh={refresh} tintColor={colors.accent} />
                    }
                    ListEmptyComponent={
                        // Rendered only when there is genuinely nothing to join.
                        // Being in the sole existing room is not an empty state,
                        // but the list itself stays mounted so pull-to-refresh
                        // keeps working.
                        currentRoom ? null : (
                            <View style={styles.emptyState}>
                                <BookLover width={200} height={200} />
                                <Text style={styles.emptyText}>No silent rooms yet</Text>
                                <Text style={styles.emptySubtext}>Create one now</Text>
                                <TouchableOpacity
                                    style={styles.createRoundButton}
                                    onPress={createRoom}
                                    activeOpacity={0.85}
                                >
                                    <Icon name="plus" />
                                </TouchableOpacity>
                            </View>
                        )
                    }
                />}
        </View>
    )
}

const useStyles = (colors: any) => StyleSheet.create({
    container: {
        flex: 1,
        marginHorizontal: Spacing.three,
        backgroundColor: colors.background,
    },
    listContent: {
        paddingTop: Spacing.three,
    },
    currentRoomSection: {
        marginBottom: Spacing.two,
        gap: Spacing.two,
    },
    sectionLabel: {
        fontSize: 12,
        fontWeight: '600',
        color: colors.textSecondary,
        textTransform: 'uppercase',
        letterSpacing: 0.6,
    },
    emptyState: {
        alignItems: 'center',
        marginTop: Spacing.six,
        gap: Spacing.three,
    },
    emptyText: {
        fontSize: 15,
        fontWeight: '600',
        color: colors.textSecondary,
    },
    emptySubtext: {
        fontSize: 14,
        color: colors.textSecondary,
        marginTop: -Spacing.two,
    },
    createRoundButton: {
        width: 50,
        height: 50,
        borderRadius: 25,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: colors.text,
    },
});
