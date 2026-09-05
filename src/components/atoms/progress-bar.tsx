import { StyleProp, StyleSheet, View, ViewStyle } from 'react-native';

import type { ThemeColor } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

interface ProgressBarProps {
    /** 0–1. Clamped, so a bad ratio can never render a bar wider than its track. */
    progress: number;
    height?: number;
    /** Must be a token that reads correctly on the surface behind it — the
     *  timer card sits on a fixed-colour surface, a book row on the page. */
    trackColor?: ThemeColor;
    fillColor?: ThemeColor;
    style?: StyleProp<ViewStyle>;
    testID?: string;
}

/**
 * A filled track. Extracted from the two hand-rolled copies in TimerCard and
 * BookItem, which differed only in height and colour tokens.
 */
export default function ProgressBar({
    progress,
    height = 4,
    trackColor = 'progressTrack',
    fillColor = 'accent',
    style,
    testID,
}: ProgressBarProps) {
    const colors = useTheme();
    const ratio = Math.min(Math.max(progress, 0), 1);

    return (
        <View
            testID={testID}
            style={[
                styles.track,
                // Radius follows the height so the track stays a capsule at
                // any size, which is what both original copies did by hand.
                { height, borderRadius: height / 2, backgroundColor: colors[trackColor] },
                style,
            ]}
        >
            <View
                style={[
                    styles.fill,
                    { borderRadius: height / 2, backgroundColor: colors[fillColor] },
                    { width: `${Math.round(ratio * 100)}%` },
                ]}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    track: { overflow: 'hidden' },
    fill: { height: '100%' },
});
