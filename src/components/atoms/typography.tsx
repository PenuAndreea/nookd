import { FontSizes, FontWeights } from "@/constants/theme";
import { useTheme } from "@/hooks/use-theme";
import { StyleProp, StyleSheet, Text, TextProps, TextStyle } from "react-native";

export type TypographyVariant = keyof typeof TypographyStyles;

type TypographyProps = TextProps & {
    variant?: TypographyVariant;
    /**
     * "sheetText"/"sheetTextSecondary" are for text on a surface that stays
     * literally white regardless of theme (a card, a sheet) — unlike "text"/
     * "textSecondary", they do not flip to near-white in dark mode, so they
     * stay readable on that surface instead of disappearing into it.
     * "inkText"/"inkTextSecondary" are the same idea inverted: text on a
     * surface that stays literally navy in both modes (the Library header).
     */
    color?:
        | "text"
        | "textSecondary"
        | "accent"
        | "sheetText"
        | "sheetTextSecondary"
        | "inkText"
        | "inkTextSecondary"
        | "error";
    style?: StyleProp<TextStyle>;
};

/**
 * Every reusable text style in the app lives here — every `fontSize`,
 * `fontWeight`, `lineHeight`, `fontFamily` and `letterSpacing` a screen or
 * component needs should come from one of these variants (via `<Typography>`
 * or, for a component that can't render a `<Text>` directly, by spreading
 * `TypographyStyles.<variant>`) rather than being re-declared inline.
 */
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
                TypographyStyles[variant],
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
export const TypographyStyles = StyleSheet.create({
    // -- Lora headings, largest to smallest --
    /** The app wordmark and top-level screen greetings (e.g. "Good morning"). */
    h1: {
        fontFamily: 'Lora_700Bold',
        fontSize: 26,
        lineHeight: 32,
    },
    /** A page's own title (e.g. the Books tab). */
    title1: {
        fontFamily: 'Lora_700Bold',
        fontSize: 24,
    },
    /** A bottom sheet's title (e.g. the room details sheet). */
    title2: {
        fontFamily: 'Lora_700Bold',
        fontSize: 22,
    },
    /** A card/hero title (e.g. the book detail screen's cover header). */
    title3: {
        fontFamily: 'Lora_700Bold',
        fontSize: 20,
    },
    /** A card heading inside a list row (e.g. BookItem's title). */
    h2: {
        fontFamily: 'Lora_700Bold',
        fontSize: 17,
        lineHeight: 23,
        marginBottom: 8,
    },
    /** A medium-size row's title (e.g. BookRow's "currently reading" card). */
    cardTitle: {
        fontFamily: 'Lora_700Bold',
        fontSize: 16,
    },

    // -- System-font headings / titles --
    /** A screen header's centered title (Header molecule). */
    navTitle: {
        fontSize: 17,
        fontWeight: FontWeights.bold,
    },
    /** A bottom sheet's inline title (e.g. "How did that feel?"). */
    sheetTitle: {
        fontSize: 18,
        fontWeight: FontWeights.semibold,
    },
    /** A bold section heading inside a sheet (e.g. "Readers in the room"). */
    sectionHeading: {
        fontSize: 16,
        fontWeight: FontWeights.bold,
    },

    // -- Body copy --
    /** Default paragraph/description text. */
    body: {
        fontSize: FontSizes.small,
        fontWeight: FontWeights.normal,
        lineHeight: 20,
    },
    /** A step up from `body` without reaching for a heading — an empty
     * state's title, an error message's headline, a sheet's field label. */
    subhead: {
        fontSize: 15,
        fontWeight: FontWeights.semibold,
    },
    /** A secondary line just under body size (e.g. the Home subtitle). */
    subtitle: {
        fontSize: 15,
        fontWeight: FontWeights.normal,
    },
    /** A count or value at slightly-larger-than-body size (e.g. a reader count). */
    bodyLarge: {
        fontSize: FontSizes.medium,
        fontWeight: FontWeights.normal,
    },
    /** Body copy with extra emphasis (e.g. a search result's title). */
    bodyBold: {
        fontSize: FontSizes.small,
        fontWeight: FontWeights.semibold,
    },

    // -- Small / meta text --
    /** The most common secondary/meta line (author names, counts, hints). */
    caption: {
        fontSize: 13,
        fontWeight: FontWeights.normal,
    },
    /** A caption with more weight (e.g. an overflow "+N" pill). */
    captionBold: {
        fontSize: 13,
        fontWeight: FontWeights.bold,
    },
    /** A caption at semibold — timer footer counts, a chip's own label. */
    captionSemibold: {
        fontSize: 13,
        fontWeight: FontWeights.semibold,
    },
    /** Small secondary text (e.g. a carousel item's title). */
    small: {
        fontSize: FontSizes.xSmall,
        fontWeight: FontWeights.normal,
    },
    /** Small text with more weight (e.g. a room's "+ Add" chip). */
    smallBold: {
        fontSize: FontSizes.xSmall,
        fontWeight: FontWeights.semibold,
    },
    /** The small-caps eyebrow label used for section/field headings
     * throughout the app — "ROOMS", "MY LIBRARY", "STATUS", a form field's
     * own label. Same metrics as `smallBold`, plus the uppercase treatment. */
    sectionLabel: {
        fontSize: FontSizes.xSmall,
        fontWeight: FontWeights.semibold,
        textTransform: 'uppercase',
        letterSpacing: 0.6,
    },
    /** The smallest text in the app (e.g. a carousel item's subtitle). */
    tiny: {
        fontSize: 11,
        fontWeight: FontWeights.normal,
    },
    /** Tiny text with more weight (e.g. a status badge's label). */
    tinyBold: {
        fontSize: 11,
        fontWeight: FontWeights.bold,
    },

    // -- One-off display text --
    /** The big countdown/elapsed digits on the room timer card. */
    timerValue: {
        fontSize: 44,
        fontWeight: FontWeights.bold,
        letterSpacing: -1.5,
    },
    /** The timer card's "Reading"/"Remaining" label under the digits. */
    timerLabel: {
        fontSize: 15,
        fontWeight: FontWeights.medium,
    },

    // -- Button text, one per `Button` `size` --
    buttonSmall: {
        fontSize: 12,
        fontWeight: FontWeights.bold,
        lineHeight: 20,
    },
    buttonMedium: {
        fontSize: FontSizes.medium,
        fontWeight: FontWeights.bold,
        lineHeight: 22,
    },
    buttonLarge: {
        fontSize: FontSizes.large,
        fontWeight: FontWeights.bold,
        lineHeight: 34,
    },
});
