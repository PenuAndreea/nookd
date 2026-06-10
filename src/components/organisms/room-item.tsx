
import { Room } from '@/app/rooms/types';
import { BorderRadius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { router } from 'expo-router';
import { Image, StyleSheet, View } from 'react-native';

import Button from '../atoms/button';
import Typography from '../atoms/typography';
import AvatarList from '../molecules/avatar-list';

const BOOK_URI = `https://covers.openlibrary.org/b/isbn/9781786892737-L.jpg?default=false`

export default function RoomItem({ room }: { room: Room }) {
    const colors = useTheme();
    const styles = useStyles(colors);

    function navigateToRoomDetails(roomId: number) {
        router.navigate(`/rooms/${roomId}`);
    }

    return (
        <View style={styles.container}>
            <Image
                style={styles.image}
                source={{ uri: BOOK_URI }}
            />
            <View style={styles.info}>
                <View style={{ justifyContent: 'flex-start' }}>
                    <Typography variant="h2">
                        Rainy Afternoon Reads
                    </Typography>
                    <Typography>
                        A gentle break
                    </Typography>
                </View>
                <View style={styles.participants}>
                    <Typography>
                        Hosted by Alice
                    </Typography>
                    <AvatarList userIds={Array.from({ length: 10 }, (_, index) => index + 1)} />
                </View>
            </View>
            <View style={styles.button}>
                <Button title="Join" size="small" onPress={() => navigateToRoomDetails(room.id)} />
            </View>
        </View>
    )
}


const useStyles = (colors: any) => StyleSheet.create({
    pressed: {
        opacity: 0.92,
        transform: [{ scale: 0.98 }],
    },
    container: {
        flexDirection: 'row',
        padding: Spacing.three,
        marginBottom: Spacing.two,
        backgroundColor: colors.white,
        borderWidth: 1,
        borderRadius: BorderRadius.medium,
        borderColor: colors.background,
    },
    participants: {
        flex: 1,
        justifyContent: 'flex-end',
        marginTop: Spacing.two
    },
    image: {
        width: 60,
        aspectRatio: 2 / 3,
        borderRadius: BorderRadius.small,
    },
    info: {
        flex: 1,
        marginLeft: Spacing.three
    },
    button: {
        justifyContent: 'flex-end'
    }
});
