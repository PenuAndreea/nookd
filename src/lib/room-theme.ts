import type { ImageSourcePropType } from 'react-native';

import dawn from '@/assets/images/illustrations/themes/dawn.png';
import golden from '@/assets/images/illustrations/themes/golden.png';
import lost from '@/assets/images/illustrations/themes/lost.png';
import morning from '@/assets/images/illustrations/themes/morning.png';
import quiet from '@/assets/images/illustrations/themes/quiet.png';

export type RoomTheme = {
    source: ImageSourcePropType;
    /**
     * The artwork's own field colour, sampled from each file. The room screen
     * paints this behind the image so the art blends into the page instead of
     * sitting on a lighter panel with a visible seam — they are close to the
     * app's creme but not the same, which is exactly the join that showed.
     */
    background: string;
};

const THEMES = {
    dawn: { source: dawn, background: '#FBF3E9' },
    golden: { source: golden, background: '#F9EEE5' },
    lost: { source: lost, background: '#F8EBE1' },
    morning: { source: morning, background: '#FAF0E5' },
    quiet: { source: quiet, background: '#F7ECE1' },
} satisfies Record<string, RoomTheme>;

/** Picked from the room's vibe so a room looks like what it is. */
const BY_VIBE: Record<string, RoomTheme> = {
    book_club: THEMES.morning,
    fantasy: THEMES.dawn,
    nonfiction: THEMES.golden,
    quiet_company: THEMES.quiet,
    lost_in_a_book: THEMES.lost,
};

const ALL = Object.values(THEMES);

export function themeForRoom(room: { id: string; vibe: string | null }): RoomTheme {
    const byVibe = room.vibe ? BY_VIBE[room.vibe] : undefined;
    if (byVibe) return byVibe;

    // Rooms created before vibes existed, or with an unknown one: stable per
    // room rather than random, so it does not change between visits.
    const hash = room.id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    return ALL[hash % ALL.length];
}
