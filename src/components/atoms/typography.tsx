import { FontSizes, FontWeights } from "@/constants/theme";
import { useTheme } from "@/hooks/use-theme";
import { PlayfairDisplay_800ExtraBold, useFonts } from '@expo-google-fonts/playfair-display';
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

    const [fontsLoaded] = useFonts({
        PlayfairDisplay_800ExtraBold
    });

    if (!fontsLoaded) return null;

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
        fontFamily: 'inter',
    },
    h1: {
        fontFamily: 'PlayfairDisplay_800ExtraBold',
        fontSize: 24,
        fontWeight: FontWeights.bold,
    },
    h2: {
        fontFamily: 'PlayfairDisplay_800ExtraBold',
        fontWeight: FontWeights.bold,
        lineHeight: 22,
        marginBottom: 8,
        fontSize: 16
    },
    body: {
        fontSize: FontSizes.small,
        fontWeight: FontWeights.normal,
        lineHeight: 20,
    },
});
