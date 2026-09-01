import { FontSizes, FontWeights } from "@/constants/theme";
import { useTheme } from "@/hooks/use-theme";
import { StyleProp, StyleSheet, Text, TextProps, TextStyle } from "react-native";

type TypographyVariant = "h1" | "h2" | "body";

type TypographyProps = TextProps & {
    variant?: TypographyVariant;
    color?: "text" | "textSecondary" | "accent";
    style?: StyleProp<TextStyle>;
};

export default function Typography({
    variant = "body",
    color = "text",
    style,
    ...props
}: TypographyProps) {
    const colors = useTheme();

    return (
        <Text
            {...props}
            style={[
                styles[variant],
                { color: colors[color] },
                style,
            ]}
        />
    );
}

// Headings use Lora, a screen-first serif: far lower stroke contrast than
// Playfair, so it stays legible at heading sizes. The family already carries
// the weight, so no fontWeight here — setting one makes iOS synthesise a
// second bold on top.
const styles = StyleSheet.create({
    h1: {
        fontFamily: 'Lora_700Bold',
        fontSize: 26,
        lineHeight: 32,
    },
    h2: {
        fontFamily: 'Lora_700Bold',
        fontSize: 17,
        lineHeight: 23,
        marginBottom: 8,
    },
    body: {
        fontSize: FontSizes.small,
        fontWeight: FontWeights.normal,
        lineHeight: 20,
    },
});
