import { FontLineHeights, FontSizes } from "@/constants/theme";
import { useTheme } from "@/hooks/use-theme";
import { Pressable, StyleSheet, Text } from "react-native";

const ButtonSizes = {
    small: {
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 8,
        fontSize: FontSizes.small,
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
    title: string;
    onPress: () => void;
    floating?: boolean;
    size?: keyof typeof ButtonSizes;
}

export default function Button({ title, onPress, floating, size }: ButtonProps) {
    const colors = useTheme();
    const styles = createStyles(colors, size);

    return (
        <Pressable
            style={({ pressed }) => [
                styles.button,
                floating && styles.floating,
                pressed && styles.pressed,
            ]}
            onPress={onPress}>
            <Text style={[styles.buttonText, floating && styles.floatingText]}>{title}</Text>
        </Pressable>
    );
}


const createStyles = (colors: ReturnType<typeof useTheme>, size?: keyof typeof ButtonSizes) =>
    StyleSheet.create({
        button: {
            backgroundColor: colors.accent,
            paddingHorizontal: ButtonSizes[size || 'medium'].paddingHorizontal,
            paddingVertical: ButtonSizes[size || 'medium'].paddingVertical,
            borderRadius: ButtonSizes[size || 'medium'].borderRadius
        },
        floating: {
            position: 'absolute',
            alignSelf: 'center',
            top: 6,
            width: 56,
            height: 56,
            borderRadius: 28,
            alignItems: 'center',
            justifyContent: 'center',
        },
        buttonText: {
            color: colors.text,
            textAlign: 'center',
            fontWeight: 'bold',
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
