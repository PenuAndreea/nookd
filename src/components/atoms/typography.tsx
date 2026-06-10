import { Fonts, FontSizes, FontWeights } from "@/constants/theme";
import { useTheme } from "@/hooks/use-theme";
import { StyleProp, StyleSheet, Text, TextProps, TextStyle } from "react-native";

type TypographyVariant = "h2" | "body";

type TypographyProps = TextProps & {
    variant?: TypographyVariant;
    color?: "text" | "textSecondary";
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
                styles.base,
                styles[variant],
                { color: colors[color] },
                style,
            ]}
        />
    );
}

const styles = StyleSheet.create({
    base: {
        fontFamily: Fonts?.sans,
    },
    h2: {
        fontSize: FontSizes.medium,
        fontWeight: FontWeights.bold,
        lineHeight: 22,
    },
    body: {
        fontSize: FontSizes.small,
        fontWeight: FontWeights.normal,
        lineHeight: 20,
    },
});
