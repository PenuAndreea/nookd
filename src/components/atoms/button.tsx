import { FontLineHeights, FontSizes } from "@/constants/theme";
import { useTheme } from "@/hooks/use-theme";
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
    onPress: () => void;
    floating?: boolean;
    size?: keyof typeof ButtonSizes;
}

export default function Button({ title, icon, onPress, floating, size }: ButtonProps) {
    const colors = useTheme();
    const styles = createStyles(colors, size, floating);

    return (
        <Pressable
            style={({ pressed }) => [
                styles.button,
                floating && styles.floating,
                pressed && styles.pressed,
            ]}
            onPress={onPress}>
            {icon && <Icon name={icon} color={floating ? colors.accent : colors.text} />}
            {title && <Text style={[styles.buttonText, floating && styles.floatingText]}>{title}</Text>}
        </Pressable>
    );
}


const createStyles = (colors: ReturnType<typeof useTheme>, size?: keyof typeof ButtonSizes, floating?: boolean) =>
    StyleSheet.create({
        button: {
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 6,
            backgroundColor: colors.accent,
            paddingHorizontal: ButtonSizes[size || 'medium'].paddingHorizontal,
            paddingVertical: ButtonSizes[size || 'medium'].paddingVertical,
            borderRadius: ButtonSizes[size || 'medium'].borderRadius
        },
        floating: {
            position: 'absolute',
            alignSelf: 'center',
            top: 6,
            width: 50,
            height: 50,
            borderRadius: 28,
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: colors.text
        },
        buttonText: {
            color: floating ? colors.accent : colors.text,
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
