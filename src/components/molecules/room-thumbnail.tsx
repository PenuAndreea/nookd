import { Image, StyleSheet, View } from 'react-native';

import { RoomWithDetails } from '@/api/rooms';
import { useTheme } from '@/hooks/use-theme';
import { themeForRoom } from '@/lib/room-theme';

// How tall a "stretch" thumbnail is. Not a true dynamic match to its sibling
// text column: `alignSelf: 'stretch'` against a row with no explicit height
// (RoomItem's card is sized by its content, not a fixed height) resolves
// against whatever ancestor *does* have a defined height — in a FlatList row
// that ended up being the scrollable list itself, blowing the thumbnail up
// to fill the screen. A fixed height sized for a typical 2-3 line card is
// far more predictable than fighting that cross-axis ambiguity.
const STRETCH_HEIGHT = 96;

/**
 * A room's picture. Uses the same artwork the room screen shows behind its
 * timer, so a room looks like itself everywhere it appears.
 *
 * `stretch` renders it taller than the plain square, to better match a card
 * with a few lines of text beside it (see `STRETCH_HEIGHT`).
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
                { width, height: stretch ? STRETCH_HEIGHT : width, backgroundColor: colors.soft },
            ]}
        >
            <Image source={themeForRoom(room).source} style={styles.image} resizeMode="cover" />
        </View>
    );
}

const styles = StyleSheet.create({
    frame: {
        borderRadius: 12,
        overflow: 'hidden',
    },
    image: {
        width: '100%',
        height: '100%',
    },
});
