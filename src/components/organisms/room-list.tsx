import { ActivityIndicator, FlatList, RefreshControl, StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { router } from 'expo-router';

import ReadingNook from '@/assets/images/icons/reading-nook.svg';
import BookLover from '@/assets/images/illustrations/cuate/book-lover.svg';
import Button from '@/components/atoms/button';
import Typography from '@/components/atoms/typography';
import { EmptyState } from '@/components/molecules/empty-state';
import { ErrorState } from '@/components/molecules/error-state';
import { Spacing } from '@/constants/theme';
import { useRooms } from '@/contexts/rooms-context';
import { useTheme } from '@/hooks/use-theme';
import CurrentRoomBanner from './current-room-banner';
import RoomItem from './room-item';

export default function RoomList() {
    const { rooms, currentRoom, loading, refreshing, error, refresh } = useRooms();
    const colors = useTheme();
    const styles = useStyles(colors);
    const { t } = useTranslation();

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
            {currentRoom && <CurrentRoomBanner room={currentRoom} />}
            {showOtherRooms && <Typography variant="sectionLabel" color="textSecondary">{t('rooms.sectionLabel')}</Typography>}
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
                        currentRoom ? null : error ? (
                            <ErrorState
                                title={t('rooms.loadErrorTitle')}
                                subtitle={t('rooms.loadErrorSubtitle')}
                                onRetry={refresh}
                            />
                        ) : (
                            <EmptyState
                                illustration={<BookLover width={200} height={200} />}
                                title={t('rooms.emptyTitle')}
                                subtitle={t('rooms.emptySubtitle')}
                                action={
                                    <Button
                                        round
                                        iconNode={<ReadingNook width={26} height={26} color={colors.accent} />}
                                        onPress={createRoom}
                                    />
                                }
                            />
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
        marginTop: Spacing.four,
    },
    listContent: {
        paddingTop: Spacing.three,
    },
});
