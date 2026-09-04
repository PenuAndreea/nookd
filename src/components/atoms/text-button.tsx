import { StyleProp, StyleSheet, Text, TextStyle, TouchableOpacity } from 'react-native';

import { TypographyStyles } from './typography';
import { useTheme } from '@/hooks/use-theme';

interface TextButtonProps {
    title: string;
    onPress: () => void;
    /** Plain secondary text instead of the accent-colored default (e.g. auth footer links). */
    variant?: 'accent' | 'secondary';
    disabled?: boolean;
    style?: StyleProp<TextStyle>;
}

/**
 * A tappable line of text with no fill or border — for lightweight actions
 * that would look too heavy as a filled `Button` (an inline "add" link, a
 * footer "sign up instead" prompt).
 */
export default function TextButton({ title, onPress, variant = 'accent', disabled, style }: TextButtonProps) {
    const colors = useTheme();
    const styles = createStyles(colors);

    return (
        <TouchableOpacity onPress={onPress} disabled={disabled} hitSlop={8} activeOpacity={0.7}>
            <Text style={[styles.text, variant === 'secondary' && styles.secondary, disabled && styles.disabled, style]}>
                {title}
            </Text>
        </TouchableOpacity>
    );
}

const createStyles = (colors: ReturnType<typeof useTheme>) => StyleSheet.create({
    text: {
        ...TypographyStyles.subhead,
        color: colors.accent,
    },
    secondary: {
        ...TypographyStyles.subtitle,
        color: colors.textSecondary,
        textAlign: 'center',
    },
    disabled: {
        opacity: 0.5,
    },
});
