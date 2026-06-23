import { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated from 'react-native-reanimated';

import { getRoom, Room } from '@/api/nookd';
import ReadingBook from '@/assets/images/illustrations/themes/Morning_Pages.svg';
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

    const { members, memberCount, isJoined, elapsedSeconds, leaveRoom } =
        useRoomPresence(id, session?.user?.id)

    const [room, setRoom] = useState<Room | undefined>();

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
                />
            </View>
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
});
