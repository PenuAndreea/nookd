import { TypographyStyles } from "./typography";
import { useTheme } from "@/hooks/use-theme";
import { ReactNode } from "react";
import { Pressable, StyleSheet, Text } from "react-native";
import { Icon, IconName } from "./icon";

// Layout only — the font side of each size (fontSize/lineHeight/fontWeight)
// lives in Typography's buttonSmall/buttonMedium/buttonLarge, so it isn't
// declared twice.
const ButtonSizes = {
    small: {
        paddingHorizontal: 14,
        paddingVertical: 6,
        borderRadius: 12,
    },
    medium: {
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 12,
    },
    large: {
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderRadius: 16,
    },
}

const ButtonTextStyles = {
    small: TypographyStyles.buttonSmall,
    medium: TypographyStyles.buttonMedium,
    large: TypographyStyles.buttonLarge,
}

type ButtonProps = {
    title?: string;
    icon?: IconName;
    /** Custom icon element, used instead of `icon` for artwork SF Symbols can't express. */
    iconNode?: ReactNode;
    onPress: () => void;
    /** Circular icon-only button on the dark surface. */
    round?: boolean;
    /** Required for icon-only buttons, which carry no text for a screen reader to announce. */
    accessibilityLabel?: string;
    /** White pill on a colored surface (e.g. the "Return to room" banner action) instead of the accent-filled default. */
    variant?: 'primary' | 'surface';
    /** Stretches to fill its container instead of sizing to its content. */
    fullWidth?: boolean;
    size?: keyof typeof ButtonSizes;
}

export default function Button({ title, icon, iconNode, onPress, round, accessibilityLabel, variant = 'primary', fullWidth, size }: ButtonProps) {
    const colors = useTheme();
    const isRound = round;
    const isSurface = variant === 'surface';
    const styles = createStyles(colors, size, isRound, isSurface);

    return (
        <Pressable
            style={({ pressed }) => [
                styles.button,
                isRound && styles.round,
                isSurface && styles.surface,
                fullWidth && styles.fullWidth,
                pressed && styles.pressed,
            ]}
            accessibilityRole="button"
            accessibilityLabel={accessibilityLabel}
            onPress={onPress}>
            {iconNode ?? (icon && <Icon name={icon} color={isRound ? colors.accent : colors.ink} />)}
            {title && <Text style={[styles.buttonText, isRound && styles.roundText]}>{title}</Text>}
        </Pressable>
    );
}


const createStyles = (colors: ReturnType<typeof useTheme>, size?: keyof typeof ButtonSizes, isRound?: boolean, isSurface?: boolean) =>
    StyleSheet.create({
        button: {
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 6,
            backgroundColor: isSurface ? colors.white : colors.accent,
            paddingHorizontal: ButtonSizes[size || 'medium'].paddingHorizontal,
            paddingVertical: ButtonSizes[size || 'medium'].paddingVertical,
            borderRadius: ButtonSizes[size || 'medium'].borderRadius
        },
        surface: {
            borderRadius: 999,
        },
        fullWidth: {
            alignSelf: 'stretch',
        },
        round: {
            width: 50,
            height: 50,
            borderRadius: 28,
            paddingHorizontal: 0,
            paddingVertical: 0,
            alignItems: 'center',
            justifyContent: 'center',
            // Fixed dark circle regardless of theme — this is a brand accent
            // (dark navy + yellow icon), not a surface that should invert to
            // a near-white circle in dark mode.
            backgroundColor: colors.ink,
        },
        buttonText: {
            ...ButtonTextStyles[size || 'medium'],
            // Both non-round backgrounds (`accent`, `white`) are fixed values
            // that do not flip with the theme, so this cannot use the
            // flipping `text` token either — it would go near-white-on-yellow
            // (primary) or near-white-on-white (surface) in dark mode.
            color: isRound ? colors.accent : colors.ink,
            textAlign: 'center',
        },
        roundText: {
            ...ButtonTextStyles[size || 'medium'],
        },
        pressed: {
            opacity: 0.92,
            transform: [{ scale: 0.98 }],
        },
    });
