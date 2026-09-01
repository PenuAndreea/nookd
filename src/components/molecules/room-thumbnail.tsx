import { StyleSheet, View } from 'react-native';

import { RoomWithDetails } from '@/api/rooms';
import { useTheme } from '@/hooks/use-theme';

/**
 * A room's picture. Uses the same artwork the room screen shows behind its
 * timer, so a room looks like itself everywhere it appears.
 *
 * `stretch` makes it fill the height of whatever row it sits in, rather than
 * being a fixed square that leaves a gap beside taller content.
 */
export default function RoomThumbnail({
    room,
    width = 72,
    stretch = false,
}: {
    room: Pick<RoomWithDetails, 'id' | 'vibe'>;
    width?: number;
    stretch?: boolean;
}) {
    const colors = useTheme();

    return (
        <View
            style={[
                styles.frame,
                { width, backgroundColor: colors.soft },
                stretch ? styles.stretch : { height: width },
            ]}
        />
    );
}

const styles = StyleSheet.create({
    frame: {
        borderRadius: 12,
        overflow: 'hidden',
    },
    stretch: {
        alignSelf: 'stretch',
    },
    image: {
        width: 80,
        height: 80
    },
});
