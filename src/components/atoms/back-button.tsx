import { StyleSheet, Text, TouchableOpacity } from 'react-native';

import { useTheme } from '@/hooks/use-theme';

interface BackButtonProps {
    onPress: () => void;
}

/** The circular back-chevron button used at the left of a screen header. */
export default function BackButton({ onPress }: BackButtonProps) {
    const colors = useTheme();
    const styles = createStyles(colors);

    return (
        <TouchableOpacity
            style={styles.backButton}
            onPress={onPress}
            hitSlop={8}
            activeOpacity={0.7}
        >
            <Text style={styles.backArrow}>‹</Text>
        </TouchableOpacity>
    );
}

const createStyles = (colors: ReturnType<typeof useTheme>) => StyleSheet.create({
    backButton: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: colors.white,
        borderWidth: 0.5,
        borderColor: colors.border,
        alignItems: 'center',
        justifyContent: 'center',
    },
    backArrow: {
        fontSize: 24,
        // The circle behind this is always white, so the arrow needs the
        // always-dark `sheetText` token, not `text` — which turns near-white
        // in dark mode and would vanish on a white circle.
        color: colors.sheetText,
        lineHeight: 28,
    },
});
