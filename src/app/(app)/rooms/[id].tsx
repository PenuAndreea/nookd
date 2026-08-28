import BottomSheet, { BottomSheetBackdrop, BottomSheetBackdropProps, BottomSheetView } from '@gorhom/bottom-sheet';
import { useCallback, useEffect, useRef, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated from 'react-native-reanimated';

import { getRoom, Room } from '@/api/nookd';
import ReadingBook from '@/assets/images/illustrations/themes/Morning_Pages.svg';
import Button from '@/components/atoms/button';
import { Header } from '@/components/molecules/header';
import TimerCard from '@/components/organisms/timer-card';
import { useAuth } from '@/contexts/auth-context';
import { useRoomPresence } from '@/hooks/use-room-presence';
import { useTheme } from '@/hooks/use-theme';
import { useLocalSearchParams } from 'expo-router';

export default function SilentRoomScreen() {
    const { id } = useLocalSearchParams();
    const { session } = useAuth();
    const colors = useTheme();

    const { members, memberCount, elapsedSeconds, leaveRoom } =
        useRoomPresence(id, session?.user?.id)

    const [room, setRoom] = useState<Room | undefined>();

    const bottomSheetRef = useRef<BottomSheet>(null);
    const snapPoints = ['40%', '75%'];

    useEffect(() => {
        async function loadRoom() {
            try {
                const data = await getRoom(id.toString())

                setRoom(data)
            } catch (error) {
                console.log('Error fetching room:', error)
            }
        }
        loadRoom()
    }, [])

    const openDetails = () => {
        bottomSheetRef.current?.snapToIndex(0);
    };

    const renderBackdrop = useCallback(
        (props: BottomSheetBackdropProps) => (
            <BottomSheetBackdrop
                {...props}
                appearsOnIndex={0}
                disappearsOnIndex={-1}
                pressBehavior="close"
                opacity={0.35}
            />
        ),
        []
    );

    return (
        <View style={{ flex: 1, backgroundColor: colors.creme }}>
            <View style={{ marginTop: 60 }} hitSlop={10}>
                <Header title='' showBack />
            </View>
            <View style={{ flex: 1 }}>
                <Animated.View style={styles.illustration}>
                    <ReadingBook width='100%' height='100%' />
                </Animated.View>
                <TimerCard
                    remaining={elapsedSeconds}
                    duration={room?.duration_minutes ?? 0}
                    memberCount={memberCount}
                    onPress={openDetails}
                />
            </View>

            <BottomSheet
                ref={bottomSheetRef}
                index={-1}
                snapPoints={snapPoints}
                enablePanDownToClose
                backdropComponent={renderBackdrop}
                backgroundStyle={styles.sheetBackground}
                handleIndicatorStyle={styles.handleIndicator}
            >
                <BottomSheetView style={styles.sheetContent}>
                    <Text style={styles.sheetTitle}>{room?.name ?? 'Room details'}</Text>

                    <View style={styles.section}>
                        <Text style={styles.sectionLabel}>
                            Reading with {memberCount} {memberCount === 1 ? 'person' : 'people'}
                        </Text>
                        {members?.map((member) => (
                            <View key={member.id} style={styles.memberRow}>
                                <Text style={styles.memberName}>{member.name}</Text>
                            </View>
                        ))}
                    </View>
                    <Button title="Leave room" onPress={() => {
                        leaveRoom();
                        bottomSheetRef.current?.close();
                    }} />
                </BottomSheetView>
            </BottomSheet>
        </View>
    );
}

const styles = StyleSheet.create({
    illustration: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        height: '82%'
    },
    sheetBackground: {
        backgroundColor: '#fff',
        borderTopLeftRadius: 26,
        borderTopRightRadius: 26,
        shadowColor: '#263238',
        shadowOpacity: 0.18,
        shadowRadius: 40,
        shadowOffset: {
            width: 0,
            height: -10
        },
        elevation: 12,
    },
    handleIndicator: {
        backgroundColor: '#d8d2c4',
        width: 40,
    },
    sheetContent: {
        flex: 1,
        paddingHorizontal: 24,
        paddingVertical: 16,
    },
    sheetTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: '#263238',
        marginBottom: 16,
    },
    section: {
        marginBottom: 24,
    },
    sectionLabel: {
        fontSize: 13,
        color: '#8a8378',
        marginBottom: 8,
    },
    memberRow: {
        paddingVertical: 6,
    },
    memberName: {
        fontSize: 15,
        color: '#263238',
    },
});