
import { RoomWithDetails } from '@/api/nookd';
import { BorderRadius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { router } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import Button from '../atoms/button';
import Typography from '../atoms/typography';

import Chilling from '../../../assets/images/illustrations/chilling-cuate.svg';
import KidsReading from '../../../assets/images/illustrations/kids-reading-cuate.svg';
import ReadingBook from "../../../assets/images/illustrations/reading-book-cuate.svg";
import StayHome from '../../../assets/images/illustrations/stay-at-home-cuate.svg';
import StayIn from '../../../assets/images/illustrations/staying-in-cuate.svg';
import WomanReading from '../../../assets/images/illustrations/woman-reading-cuate.svg';

const ROOM_ILLUSTRATIONS = [KidsReading, ReadingBook, StayHome, StayIn, WomanReading, Chilling]

export default function RoomItem({ room }: { room: RoomWithDetails }) {
    const colors = useTheme();
    const styles = useStyles(colors);
    const BOOK_URI = `https://covers.openlibrary.org/b/isbn/${room.isbn}-L.jpg`

    const hashId = (id: string) =>
        id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0)

    const getIllustration = (index: number) =>
        ROOM_ILLUSTRATIONS[index % ROOM_ILLUSTRATIONS.length]

    const Illustration = getIllustration(hashId(room?.id))

    async function navigateToRoomDetails(roomId: RoomWithDetails['id']) {
        router.navigate(`/rooms/${roomId}`)
    }

    return (
        <View style={styles.container}>
            <View style={{ width: 80, height: 80, backgroundColor: '#F2ECE3', borderRadius: 12, flexWrap: 'wrap' }}>
                <Illustration height={80} width={80} />
            </View>
            <View style={styles.info}>
                <View style={{ justifyContent: 'flex-start' }}>
                    <Typography variant="h2">
                        {room.name}
                    </Typography>
                    <Typography numberOfLines={2} color="textSecondary">
                        {room.description} adding some more content here
                    </Typography>
                </View>
            </View>
            <View style={styles.button}>
                <Button title="Join" size="small" onPress={() => navigateToRoomDetails(room?.id)} />
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
        boxShadow: ' rgba(0, 0, 0, 0.1) 0px 1px 3px 0px, rgba(0, 0, 0, 0.06) 0px 1px 2px 0px',
    },
    participants: {
        flex: 1,
        justifyContent: 'flex-end',
        marginTop: Spacing.two
    },
    info: {
        flex: 1,
        marginLeft: Spacing.three
    },
    button: {
        justifyContent: 'flex-end'
    }
});
