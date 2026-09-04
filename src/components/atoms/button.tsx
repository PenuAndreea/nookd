import { FontLineHeights, FontSizes } from "@/constants/theme";
import { useTheme } from "@/hooks/use-theme";
import { ReactNode } from "react";
import { Pressable, StyleSheet, Text } from "react-native";
import { Icon, IconName } from "./icon";

const ButtonSizes = {
    small: {
        paddingHorizontal: 14,
        paddingVertical: 6,
        borderRadius: 12,
        fontSize: 12,
        lineHeight: FontLineHeights.small,
    },
    medium: {
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 12,
        fontSize: FontSizes.medium,
        lineHeight: FontLineHeights.medium,
    },
    large: {
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderRadius: 16,
        fontSize: FontSizes.large,
        lineHeight: FontLineHeights.large,
    },
}

type ButtonProps = {
    title?: string;
    icon?: IconName;
    /** Custom icon element, used instead of `icon` for artwork SF Symbols can't express. */
    iconNode?: ReactNode;
    onPress: () => void;
    /** Circular icon-only button on the dark surface. */
    round?: boolean;
    /** A `round` button pinned over the tab bar. */
    floating?: boolean;
    /** White pill on a colored surface (e.g. the "Return to room" banner action) instead of the accent-filled default. */
    variant?: 'primary' | 'surface';
    /** Stretches to fill its container instead of sizing to its content. */
    fullWidth?: boolean;
    size?: keyof typeof ButtonSizes;
}

export default function Button({ title, icon, iconNode, onPress, round, floating, variant = 'primary', fullWidth, size }: ButtonProps) {
    const colors = useTheme();
    // Floating is a round button that also pins itself over the tab bar, so it
    // always carries the round treatment too.
    const isRound = round || floating;
    const isSurface = variant === 'surface';
    const styles = createStyles(colors, size, isRound, isSurface);

    return (
        <Pressable
            style={({ pressed }) => [
                styles.button,
                isRound && styles.round,
                isSurface && styles.surface,
                fullWidth && styles.fullWidth,
                floating && styles.floating,
                pressed && styles.pressed,
            ]}
            onPress={onPress}>
            {iconNode ?? (icon && <Icon name={icon} color={isRound ? colors.accent : colors.ink} />)}
            {title && <Text style={[styles.buttonText, isRound && styles.floatingText]}>{title}</Text>}
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
        floating: {
            position: 'absolute',
            alignSelf: 'center',
            top: 6,
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
            // Both non-round backgrounds (`accent`, `white`) are fixed values
            // that do not flip with the theme, so this cannot use the
            // flipping `text` token either — it would go near-white-on-yellow
            // (primary) or near-white-on-white (surface) in dark mode.
            color: isRound ? colors.accent : colors.ink,
            textAlign: 'center',
            fontWeight: '700',
            fontSize: ButtonSizes[size || 'medium'].fontSize,
            lineHeight: ButtonSizes[size || 'medium'].lineHeight,
        },
        floatingText: {
            fontSize: ButtonSizes[size || 'medium'].fontSize,
            fontWeight: '700',
            lineHeight: ButtonSizes[size || 'medium'].lineHeight,
        },
        pressed: {
            opacity: 0.92,
            transform: [{ scale: 0.98 }],
        },
    });
